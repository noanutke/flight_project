using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using LSL;

// 2015-05-11, added markers, and virtual feedback
// 2015-05-12, added continuous feedback
// 2015-05-14, made LSL parameters configurable, some renaming, more comments
public class LSL_BCI_Input : MonoBehaviour 
{
	// --- PUBLIC, configurable variables ---
	public bool LSL_BCI_Recv_FB_Enabled        = false;
	public bool LSL_BCI_Send_Markers_Enabled   = true;
	public bool LSL_BCI_Send_Feedback_Enabled  = true;
	public bool LSL_BCI_Send_StickMvmt_Enabled = true;
	public bool LSL_BCI_Send_Positions_Enabled = true;

	// Number of samples in window used for weighting to display feedback
	public int WEIGHT_WIN_LENGTH = 300;

	// --- PRIVATE variables ---
	private liblsl.StreamInlet  sLSLInBCISignal  = null;   	// LSL stream handle for incoming BCI control signal
	private liblsl.StreamOutlet sMarkerStreamOut = null; 	// LSL output stream for markers as triggered by stick movements
	private liblsl.StreamOutlet sLSLOutFeedback  = null; 	// LSL output stream for smoothed feedback as displayed to user
	private liblsl.StreamOutlet sLSLPositionsStream  = null;
	private liblsl.StreamOutlet sLSLOutStickMvmtPitch = null; 	// LSL output stream for continuous stick movement in pitch direction
	private liblsl.StreamOutlet sLSLOutStickMvmtYaw = null;
	private liblsl.StreamOutlet sMarkerWithTimesStreamOut = null; 

	private bool bLSLConnected = false;
	private bool bLSL_Send_Markers_Connected = false;
	private bool bLSL_Send_Feedback_Connected = false;
	private bool bLSL_Send_StickMvmt_Connected = false;
	private bool bLSL_Send_Positions_Connected = false;

	private Queue<float> qBCIC1 = null;
	private Queue<float> qBCIC2 = null;
	private double[] aWeights = null;

	private double[] dOutFBSample = null;
	private double[] dOutFlightParamSample = null;
	private double[] dOutStickMvmtSample = null;


	// Use this for initialization
	void Start () 
	{
		qBCIC1 = new Queue <float> ();
		qBCIC2 = new Queue <float> ();
		aWeights = new double[WEIGHT_WIN_LENGTH];

		dOutFBSample = new double[1];
		dOutFlightParamSample = new double[11];
		dOutStickMvmtSample = new double[1];

		for (int k = 0; k < (WEIGHT_WIN_LENGTH-1); k++)
		{
			qBCIC1.Enqueue (0.0f);
			qBCIC2.Enqueue (0.0f);

			// Linear temporal, probabilistic weighting, where more recent
			// input receives higher weights. Normalized using formula for sum 
			// of ascending integer array (N*(N+1)/2)
			aWeights[k] = k / (WEIGHT_WIN_LENGTH*(WEIGHT_WIN_LENGTH+1.0)/2.0);
		}

		// --- OPEN LSL Online Feedback Output stream ---
		
		if (LSL_BCI_Send_Feedback_Enabled) 
		{
			liblsl.StreamInfo sOutFeedbackStreamInfo = new liblsl.StreamInfo ( "NEDE_FlightParams", "Position", 8, 75, liblsl.channel_format_t.cf_double64, "NEDE_FlightParams" );
			
			sLSLOutFeedback = new liblsl.StreamOutlet ( sOutFeedbackStreamInfo );
			
			if ( sLSLOutFeedback != null )
			{
				bLSL_Send_Feedback_Connected = true;

				Debug.Log ( "## Sending of flight parameters (plane position, head orientation) enabled!!" );
			}
		}

		if (LSL_BCI_Send_Positions_Enabled) 
		{
			liblsl.StreamInfo sOutPositionsStreamInfo = new liblsl.StreamInfo ( "NEDE_PositionsParams", "Position", 11, 75, liblsl.channel_format_t.cf_double64, "NEDE_FlightParams" );

			sLSLPositionsStream = new liblsl.StreamOutlet ( sOutPositionsStreamInfo );

			if ( sLSLPositionsStream != null )
			{
				bLSL_Send_Positions_Connected = true;

				Debug.Log ( "## Sending of flight parameters (plane position, head orientation) enabled!!" );
			}
		}
		
		// --- OPEN LSL Online Stick Movemenet Output stream ---
		
		if (LSL_BCI_Send_StickMvmt_Enabled) 
		{
			liblsl.StreamInfo sOutStickMvmtPitchStreamInfo = new liblsl.StreamInfo ( "NEDE_StickMvmtPitch", "StickMvmt", 1, 0, liblsl.channel_format_t.cf_double64, "NEDE_Brainflight_ContinuousStickMvmtPitch" );

			sLSLOutStickMvmtPitch = new liblsl.StreamOutlet ( sOutStickMvmtPitchStreamInfo );

			liblsl.StreamInfo sOutStickMvmtYawStreamInfo = new liblsl.StreamInfo ( "NEDE_StickMvmtYaw", "StickMvmt", 1, 0, liblsl.channel_format_t.cf_double64, "NEDE_Brainflight_ContinuousStickMvmtPitch" );

			sLSLOutStickMvmtYaw = new liblsl.StreamOutlet ( sOutStickMvmtYawStreamInfo );
			
			if ( sLSLOutStickMvmtPitch != null && sLSLOutStickMvmtYaw != null)
			{
				bLSL_Send_StickMvmt_Connected = true;
			}
		}
		
		// --- OPEN LSL Marker Output stream ---

		if (LSL_BCI_Send_Markers_Enabled) 
		{
			liblsl.StreamInfo sMarkerStreamInfo = new liblsl.StreamInfo ( "NEDE_Markers", "Markers", 1, 0, liblsl.channel_format_t.cf_string, "NEDE_Brainflight_Stick_Markers" );
			
			sMarkerStreamOut = new liblsl.StreamOutlet ( sMarkerStreamInfo );
			
			if ( sMarkerStreamOut != null )
			{
				bLSL_Send_Markers_Connected = true;
			}
		}

		if (LSL_BCI_Send_Markers_Enabled) 
		{
			liblsl.StreamInfo sMarkerWithTimesStreamOutInfo = new liblsl.StreamInfo ( "NEDE_MarkersWithTimes", "MarkersWithTimes", 1, 0, liblsl.channel_format_t.cf_string, "NEDE_Brainflight_Events_With_Times" );

			sMarkerWithTimesStreamOut = new liblsl.StreamOutlet ( sMarkerWithTimesStreamOutInfo );


			if ( sMarkerWithTimesStreamOut != null )
			{
				bLSL_Send_Markers_Connected = true;
			}
		}

		// --- OPEN LSL Feedback Input stream ---

		// Check whether LSL BCI feedback has 
		// been manually enabled or disabled
		if (LSL_BCI_Recv_FB_Enabled)
		{
			// Lookup lab streaming layer (LSL) stream by name within network.
			// Inputs are the property of the stream (here "name", but also possible "type"),
			// the property value (here "bci", since that is the name of the stream), then
			// the number of streams to look up and finally the timeout after which the
			// function stops to look for streams.
			liblsl.StreamInfo[] results = liblsl.resolve_stream ( "name", "bci", 1 );

			if ((results == null) || (results.Length == 0)) 
			{
				// Explicitly set flag to "NOT CONNECTED"
				bLSLConnected = false;
			}
			else
			{
				// Open new inlet based on the successfully resolved stream
				sLSLInBCISignal = new liblsl.StreamInlet(results[0]);

				if (sLSLInBCISignal != null )
				{
					// Set flag to indicate that we are connected to LSL
					bLSLConnected = true;
				}
			}
		}
	}


	// Used to push string markers into the EEG data via the labstreaminglayer
	// framework. ControlFlight uses this method to push markers related to stick
	// movement while RunFlightSim uses this method to push markers whenever the
	// the plane passes a ring.
	public void setMarker ( string sMarkerType )
	{
		setMarkerWithTime (sMarkerType);
		// Check if sending of markers is enabled in the configuration
		if ( LSL_BCI_Send_Markers_Enabled )
		{
			// Check if the marker outlet to labstreaminglayer (LSL) is open
			if ( bLSL_Send_Markers_Connected )
			{
				// Output needs to be in an array
				string[] sMarkers = new string[1];
				sMarkers[0] = sMarkerType;
				
				// Push out single Marker into the LSL stream!
				sMarkerStreamOut.push_sample( sMarkers );
				
				Debug.Log ("# DBG: SENT MARKER TYPE " + sMarkerType);
			}
		}
	}

	public void setMarkerWithTime ( string sMarkerType)
	{
		// Check if sending of markers is enabled in the configuration
		if ( LSL_BCI_Send_Markers_Enabled )
		{
			// Check if the marker outlet to labstreaminglayer (LSL) is open
			if ( bLSL_Send_Markers_Connected )
			{
				// Output needs to be in an array
				string[] sMarkers = new string[1];
				sMarkers[0] = sMarkerType;

				// Push out single Marker into the LSL stream!
				sMarkerWithTimesStreamOut.push_sample( sMarkers, liblsl.local_clock() );

				Debug.Log ("# DBG: SENT MARKER TYPE " + sMarkerType);
			}
		}
	}

	// Called by ControlFlight to continuously record stick movements in pitch direction via LSL
	public void sendStickMvmtPitch ( double dStickMvmtPitch)
	{
		if ((bLSL_Send_StickMvmt_Connected != null) && LSL_BCI_Send_StickMvmt_Enabled) 
		{
			dOutStickMvmtSample[0] = dStickMvmtPitch;

			sLSLOutStickMvmtPitch.push_sample (dOutStickMvmtSample, liblsl.local_clock());
		}
	}

	// Called by ControlFlight to continuously record stick movements in pitch direction via LSL
	public void sendStickMvmtYaw ( double dStickMvmtYaw)
	{
		if ((bLSL_Send_StickMvmt_Connected != null) && LSL_BCI_Send_StickMvmt_Enabled) 
		{
			dOutStickMvmtSample[0] = dStickMvmtYaw;

			sLSLOutStickMvmtYaw.push_sample (dOutStickMvmtSample, liblsl.local_clock());
		}
	}


	// Called by Runflight sim to continuously record X and Y pos of plane in pitch direction via LSL
	public void sendFlightParams ( double dPlaneXPos, double dPlaneYPos, double dPlaneZPos,
		double dUpperRightRingXPos, double dUpperRightRingYPos,
		double dUpperLeftRingXPos, double dUpperLeftRingYPos,
		double dLowerRightRingXPos, double dLowerRightRingYPos, 
		double dLowerLeftRingXPos, double dLowerLeftRingYPos)
	{
		// Debug.Log ( "## In send XY Pos..." );
			dOutFlightParamSample[0] = dPlaneXPos;
			dOutFlightParamSample[1] = dPlaneYPos;
			dOutFlightParamSample[2] = dPlaneZPos;
			dOutFlightParamSample[3] = dUpperRightRingXPos;
			dOutFlightParamSample[4] = dUpperRightRingYPos;
			dOutFlightParamSample[5] = dUpperLeftRingXPos;
			dOutFlightParamSample[6] = dUpperLeftRingYPos;
			dOutFlightParamSample[7] = dLowerRightRingXPos;
			dOutFlightParamSample[8] = dLowerRightRingYPos;
			dOutFlightParamSample[9] = dLowerLeftRingXPos;
			dOutFlightParamSample[10] = dLowerLeftRingYPos;

		sLSLPositionsStream.push_sample ( dOutFlightParamSample, liblsl.local_clock() );

	}


	// This is called once in every frame
	void LateUpdate () 
	{
		// --- LSL FEEDBACK INPUT ---
		
		// Check whether LSL BCI feedback has 
		// been manually enabled or disabled
		if (false && LSL_BCI_Recv_FB_Enabled) 
		{
			// Check whether LSL is connected and the inlet was opened
			if ( bLSLConnected && ( sLSLInBCISignal != null ) ) 
			{
				// For every class take one sample out of the queue
				qBCIC1.Dequeue ();
				qBCIC2.Dequeue ();

				// Create buffer to read LSL samples
				float[] sample = new float[1];

				// Pull sample from the BCI stream into the array sample.
				// The second parameter indicates the timeout; timeout 0.0
				// indicates that pull will return immediately if no data
				// is available.
				// dTime is the capture time of the signal or 0.0 if no
				// new sample is available!
				double dTime = sLSLInBCISignal.pull_sample ( sample, 0.0 );

				// Only proceed if a new sample was available!
				if ( dTime > 0.0 )
				{
					// Copy sample over and make sure its range is 0 to 1
					float fVal = sample [0] - 1;

					// Incoming BCI Feedback value is expected to be between 0 and 1.
					// This bounds the values between 0 and 1.
					fVal = Mathf.Min ( Mathf.Max ( fVal, 0.0f ), 1.0f ); 

					// Debug.Log ( "NEW VALUE " + fVal + " C1 " + (1-fVal)*100 + " C2 " + (fVal)*100 );

					qBCIC1.Enqueue ( 1-fVal );
					qBCIC2.Enqueue ( fVal );
				}
				else
				{
					qBCIC1.Enqueue ( qBCIC1.Last() );
					qBCIC2.Enqueue ( qBCIC2.Last() );
				}
			
				double fSumResultC1 = 0.0;
				double fSumResultC2 = 0.0;

				for (int k = 0; k < (WEIGHT_WIN_LENGTH-1); k++)
				{
					fSumResultC1 += ( qBCIC1.ElementAt(k) * aWeights[k] );
					fSumResultC2 += ( qBCIC2.ElementAt(k) * aWeights[k] );
				}

				double fNormResultC1 = fSumResultC1 / ( fSumResultC1 + fSumResultC2 );
				double fNormResultC2 = fSumResultC2 / ( fSumResultC1 + fSumResultC2 );

				// Retrieve reference to sphere object
				GameObject gFBSphere = GameObject.FindWithTag ( "BCI_Feedback" );
				
				if ( gFBSphere == null )
				{
					Debug.Log ( "ERROR: Game object NOT FOUND!!" );
				}
				else
				{
					// 0 is red, 1 is green. Values between are "interpolated".
					gFBSphere.GetComponent<Renderer>().material.color = new Color ((float)(fNormResultC2), (float)(fNormResultC1), 0.0f);

					dOutFBSample[0] = fNormResultC1;

					// Send actual feedback as displayed to user back via LSL so it can be recorded
					if ( LSL_BCI_Send_Feedback_Enabled && bLSL_Send_Feedback_Connected )
					{
						sLSLOutFeedback.push_sample( dOutFBSample );
					}
				}
			}
		}	
	}
}
