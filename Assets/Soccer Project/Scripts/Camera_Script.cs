using UnityEngine;
using System.Collections;

public class Camera_Script : MonoBehaviour {
	
	public Transform target;	
	public Vector3 targetOffsetPos;
	private Vector3 oldPos;	
	
	// Use this for initialization
	void Start () {
	
	}
	
	// Behaviour of camera to follow the ball
	void LateUpdate () {
	
		
		if ( GetComponent<InGameState_Script>().state == InGameState_Script.InGameState.PLAYING 
			|| GetComponent<InGameState_Script>().state == InGameState_Script.InGameState.GOAL_KICK_RUNNING
			|| GetComponent<InGameState_Script>().state == InGameState_Script.InGameState.GOAL_KICK_KICKING
		    || GetComponent<InGameState_Script>().state == InGameState_Script.InGameState.PREPARE_TO_KICK_OFF

		    ) {
			oldPos = transform.position;
			Vector3 newPos = new Vector3( target.position.x+targetOffsetPos.x, target.position.y+targetOffsetPos.y, target.position.z+targetOffsetPos.z );
			
			float lerpX =  Mathf.Lerp( oldPos.x, newPos.x,  0.05f );
			float lerpY =  Mathf.Lerp( oldPos.y, newPos.y,  0.05f );
			float lerpZ =  Mathf.Lerp( oldPos.z, newPos.z,  0.05f );
			
			transform.position = new Vector3( lerpX, lerpY, lerpZ );			transform.LookAt( target );
		}
		
		if ( GetComponent<InGameState_Script>().state == InGameState_Script.InGameState.CORNER_CHASING
			|| GetComponent<InGameState_Script>().state == InGameState_Script.InGameState.CORNER_DOING) {
		
		
			GameObject lanzador = GetComponent<InGameState_Script>().candidateToThrowIn;
		
			if ( lanzador ) {
			
				transform.position = lanzador.transform.position - lanzador.transform.forward*15.0f + lanzador.transform.up*3.0f ;
				transform.LookAt( target );
			
			}
			
		
		}		
		
	}
}
