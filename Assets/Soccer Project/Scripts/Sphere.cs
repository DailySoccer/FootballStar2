
using UnityEngine;
using System.Collections;


public class Sphere : MonoBehaviour {
	
	public GameObject owner;	// the player it owns the ball
	public GameObject inputPlayer;	// player selected
	public GameObject lastInputPlayer;	// last player selected
	private GameObject[] players;
	private GameObject[] oponents;
	public Transform shadowBall;
	public Transform blobPlayerSelected;
	public float timeToSelectAgain = 0.0f;
	public GameObject lastCandidatePlayer;
	
	[HideInInspector]	
	public float fHorizontal;
	[HideInInspector]	
	public float fVertical;
	[HideInInspector]	
	public bool bPassButton;
	[HideInInspector]	
	public bool bShootButton;
	[HideInInspector]
	public bool bShootButtonFinished;
	[HideInInspector]		
	public bool pressiPhoneShootButton = false;
	[HideInInspector]	
	public bool pressiPhonePassButton = false;
	[HideInInspector]	
	public bool pressiPhoneShootButtonEnded = false;
	
	public Joystick_Script joystick;	
	public InGameState_Script inGame;
	public float timeShootButtonPressed = 0.0f;


	// Use this for initialization
	void Start () {
		// get players, joystick, InGame and Blob
		players = GameObject.FindGameObjectsWithTag("PlayerTeam1");		
		oponents = GameObject.FindGameObjectsWithTag("OponentTeam");
		joystick = GameObject.FindGameObjectWithTag("joystick").GetComponent<Joystick_Script>();
		inGame = GameObject.FindGameObjectWithTag("MainCamera").GetComponent<InGameState_Script>();
		blobPlayerSelected = GameObject.FindGameObjectWithTag("PlayerSelected").transform;		
	}


	void LateUpdate() {
	
		shadowBall.position = new Vector3( transform.position.x, 0.35f ,transform.position.z );
		shadowBall.rotation = Quaternion.identity;

	}
	
	// Update is called once per frame
	void Update () {

		
		// get input
		fVertical = Input.GetAxis("Vertical");
		fHorizontal = Input.GetAxis("Horizontal");
		fVertical += joystick.position.y;
		fHorizontal += joystick.position.x;

		bPassButton = Input.GetKey(KeyCode.Space) || pressiPhonePassButton;
		bShootButton = Input.GetKey(KeyCode.LeftControl) || pressiPhoneShootButton;

		
		// ha soltado el boton de chut?
		if ( Input.GetKeyUp(KeyCode.LeftControl) || pressiPhoneShootButtonEnded) {
			
			bShootButtonFinished = true;
		}
		
		
		if ( bShootButton ) {
			timeShootButtonPressed += Time.deltaTime;
		
		} else {
			timeShootButtonPressed = 0.0f;
		}
				
		// if the ball has owner then just put on its feets
		if ( owner ) {
				
	 		transform.position = owner.transform.position + owner.transform.forward/1.5f + owner.transform.up/5.0f; 
			float velocity = owner.GetComponent<Player_Script>().actualVelocityPlayer.magnitude;
			
			if ( fVertical == 0.0f && fHorizontal == 0.0f  && owner.tag == "PlayerTeam1" ) {
				velocity = 0.0f;
				gameObject.GetComponent<Rigidbody>().angularVelocity = new Vector3(0,0,0);
				
			}
			
			transform.RotateAround( owner.transform.right, velocity*10.0f );
		
		}		
		
		
		
		if ( inGame.state ==  InGameState_Script.InGameState.PLAYING ) {
			
			ActivateNearestPlayer();
	
			if ( !owner || owner.tag == "PlayerTeam1" )
				ActivateNearestOponent();
		
		}
		
		
		
		
	}

	// activate nearest oponent to ball;
	void ActivateNearestOponent() {
	
		float distance = 100000.0f;
		GameObject candidatePlayer = null;
		foreach ( GameObject oponent in oponents ) {			
			
			if ( !oponent.GetComponent<Player_Script>().temporallyUnselectable ) {
				
				oponent.GetComponent<Player_Script>().state = Player_Script.Player_State.MOVE_AUTOMATIC;
				
				Vector3 relativePos = transform.InverseTransformPoint( oponent.transform.position );
				
				float newdistance = relativePos.magnitude;
				
				if ( newdistance < distance ) {
				
					distance = newdistance;
					candidatePlayer = oponent;
					
				}
			}
			
		}
		
		// set in STOLE_BALL if player found
		if ( candidatePlayer )
			candidatePlayer.GetComponent<Player_Script>().state = Player_Script.Player_State.STOLE_BALL;
		
		
	}
	
	// activate nearest player to ball
	void ActivateNearestPlayer() {
		
		lastInputPlayer = inputPlayer;
		
		float distance = 1000000.0f;
		GameObject candidatePlayer = null;
		foreach ( GameObject player in players ) {			
			
			if ( !player.GetComponent<Player_Script>().temporallyUnselectable ) {
				
				Vector3 relativePos = transform.InverseTransformPoint( player.transform.position );
				
				float newdistance = relativePos.magnitude;
				
				if ( newdistance < distance ) {
				
					distance = newdistance;
					candidatePlayer = player;
					
				}
			}
			
		}
		
		timeToSelectAgain += Time.deltaTime;
		if ( timeToSelectAgain > 0.5f ) {
			inputPlayer = candidatePlayer;
			timeToSelectAgain = 0.0f;
		} else {
			candidatePlayer = lastCandidatePlayer;
		}
		
		lastCandidatePlayer = candidatePlayer;
		
		
		if ( inputPlayer != null && candidatePlayer ) {
			blobPlayerSelected.transform.position = new Vector3( candidatePlayer.transform.position.x, candidatePlayer.transform.position.y+0.1f, candidatePlayer.transform.position.z);
			blobPlayerSelected.transform.LookAt( new Vector3( blobPlayerSelected.position.x + fHorizontal, blobPlayerSelected.position.y, blobPlayerSelected.position.z + fVertical  ) );
	
		
			// if player is not in any of this states then just CONTROLLING
			if ( inputPlayer.GetComponent<Player_Script>().state != Player_Script.Player_State.PASSING &&
			     inputPlayer.GetComponent<Player_Script>().state != Player_Script.Player_State.SHOOTING &&
			     inputPlayer.GetComponent<Player_Script>().state != Player_Script.Player_State.PICK_BALL &&
			     inputPlayer.GetComponent<Player_Script>().state != Player_Script.Player_State.CHANGE_DIRECTION &&
			     inputPlayer.GetComponent<Player_Script>().state != Player_Script.Player_State.TACKLE

			    )
			{
				inputPlayer.GetComponent<Player_Script>().state = Player_Script.Player_State.CONTROLLING;
			}
		} 
	}
	
		
	
	
}
