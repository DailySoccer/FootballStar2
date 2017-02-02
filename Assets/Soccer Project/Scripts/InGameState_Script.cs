using UnityEngine;
using System.Collections;
using System.Xml;
using System.IO;

public class InGameState_Script : MonoBehaviour {

	
	public enum InGameState {

		PLAYING,
		PREPARE_TO_KICK_OFF,
		KICK_OFF,
		GOAL,
		THROW_IN,
		THROW_IN_CHASING,
		THROW_IN_DOING,
		THROW_IN_DONE,
		CORNER,
		CORNER_CHASING,
		CORNER_DOING,
		CORNER_DOING_2,
		CORNER_DONE,
		GOAL_KICK,
		GOAL_KICK_RUNNING,
		GOAL_KICK_KICKING
		
	};
	

	public Material localTeam;
	public Material visitTeam;

	public Player_Script passer;
	public Player_Script passed;
	public Player_Script passer_oponent;
	public Player_Script passed_oponent;

	public bool scoredbylocal = false;
	public bool scoredbyvisiting = true;

	public InGameState state;
	private GameObject[] players;
	private GameObject[] oponents;
	private GameObject keeper;
	private GameObject keeper_oponent;
	public GameObject lastTouched;
	public float timeToChangeState = 0.0f;
	public Vector3 positionSide;
	public Sphere sphere;
	public Transform center;
	public Vector3 target_throw_in;
	private GameObject whoLastTouched;
	public GameObject candidateToThrowIn;
	private float timeToSaqueOponent = 3.0f;
	
	public Transform cornerSource;
	public GameObject areaCorner;
	public Transform goal_kick;
	public GameObject goalKeeper;
	public GameObject cornerTrigger;
	
	public Mesh[] Meshes;
	public Material[] Mat;
	
	private float timeToKickOff = 4.0f;
	public GameObject lastCandidate = null;
	
	public int score_local = 0;
	public int score_visiting = 0;
	
	public GameObject[] playerPrefab;
	public GameObject goalKeeperPrefab;
	public GameObject ballPrefab;

	public Transform target_oponent_goal;

	public ScorerTimeHUD scorerTime;
	public int bFirstHalf = 0;	

	public Material localMaterial;
	public Material visitMaterial;


	
	void Awake() {

	
	}
	// Use this for initialization
	void Start () {
	
		// search PLayers, Oponents and goalkeepers
		players = GameObject.FindGameObjectsWithTag("PlayerTeam1");
		oponents = GameObject.FindGameObjectsWithTag("OponentTeam");
		keeper = GameObject.FindGameObjectWithTag("GoalKeeper");
		keeper_oponent = GameObject.FindGameObjectWithTag("GoalKeeper_Oponent");
		
		state = InGameState.PREPARE_TO_KICK_OFF;

		bFirstHalf = 0;	


		// Load Team textures 
		LoadTeams ();



	}

	void LoadTeams ()
	{
		localMaterial.mainTexture = Resources.Load ("Textures/" + "player_" + PlayerPrefs.GetString ("Local") + "_texture") as Texture2D;
		visitMaterial.mainTexture = Resources.Load ("Textures/" + "player_" + PlayerPrefs.GetString ("Visit") + "_texture") as Texture2D;
	}	
	


	
	// Update is called once per frame
	void Update () {
	
		// little time between states
		timeToChangeState -= Time.deltaTime;
		
		if ( timeToChangeState < 0.0f ) {
		

			// Handle all states related to match

			switch (state) {
				
			case InGameState.PLAYING:

				if ( scorerTime.minutes > 44.0f && bFirstHalf == 0 ) {

					bFirstHalf = 1;
				}
				
				if ( scorerTime.minutes > 45.0f && bFirstHalf == 1 ) {


					sphere.transform.position = center.position;

					foreach ( GameObject player in players) {
						
						player.transform.position = player.GetComponent<Player_Script>().resetPosition;
						player.GetComponent<Animation>().Play("rest");
						
					}

					foreach ( GameObject player in oponents) {
						
						player.transform.position = player.GetComponent<Player_Script>().resetPosition;
						player.GetComponent<Animation>().Play("rest");

					}

					bFirstHalf = 2;

					scoredbylocal = true;
					scoredbyvisiting = false;
					state = InGameState.PREPARE_TO_KICK_OFF;

				}

				if ( scorerTime.minutes > 90.0f && bFirstHalf == 2) {

					PlayerPrefs.SetInt("ScoreLocal", score_local );
					PlayerPrefs.SetInt("ScoreVisit", score_visiting );

					Application.LoadLevel( "Select_Team" );

				}


				break;
	
				case InGameState.THROW_IN:
				
					whoLastTouched = lastTouched;	
				
					foreach ( GameObject go in players ) {
						go.GetComponent<Player_Script>().state = Player_Script.Player_State.RESTING;
					}
					foreach ( GameObject go in oponents ) {
						go.GetComponent<Player_Script>().state = Player_Script.Player_State.RESTING;
					}
				
				
					sphere.owner = null;
				
					if ( whoLastTouched.tag == "PlayerTeam1" )
						candidateToThrowIn = SearchPlayerNearBall( oponents );
					else	
						candidateToThrowIn = SearchPlayerNearBall( players );
				
				
					candidateToThrowIn.transform.position = new Vector3( positionSide.x, candidateToThrowIn.transform.position.y, positionSide.z);
				
					if ( whoLastTouched.tag == "PlayerTeam1" ) {
					
						candidateToThrowIn.GetComponent<Player_Script>().temporallyUnselectable = true;
						candidateToThrowIn.GetComponent<Player_Script>().timeToBeSelectable = 1.0f;
				
						candidateToThrowIn.transform.LookAt( SearchPlayerNearBall( oponents ).transform.position);
					}
					else
						candidateToThrowIn.transform.LookAt( center ); 
	
				
					candidateToThrowIn.transform.Rotate(0, sphere.fHorizontal*10.0f, 0);
					candidateToThrowIn.GetComponent<Player_Script>().state = Player_Script.Player_State.THROW_IN;
				
					sphere.GetComponent<Rigidbody>().isKinematic = true;
					sphere.gameObject.transform.position = candidateToThrowIn.GetComponent<Player_Script>().hand_bone.position;
				
					target_throw_in = candidateToThrowIn.transform.position + candidateToThrowIn.transform.forward;
				
				
					candidateToThrowIn.GetComponent<Animation>().Play("saque_banda");
					candidateToThrowIn.GetComponent<Animation>()["saque_banda"].time = 0.1f;
					candidateToThrowIn.GetComponent<Animation>()["saque_banda"].speed = 0.0f;
				
					state = InGameState.THROW_IN_CHASING;
				
				break;
				case InGameState.THROW_IN_CHASING:
				

					candidateToThrowIn.transform.position = new Vector3( positionSide.x, candidateToThrowIn.transform.position.y, positionSide.z);
					candidateToThrowIn.transform.LookAt( target_throw_in );
					candidateToThrowIn.GetComponent<Player_Script>().state = Player_Script.Player_State.THROW_IN;
				
					sphere.GetComponent<Rigidbody>().isKinematic = true;
					sphere.gameObject.transform.position = candidateToThrowIn.GetComponent<Player_Script>().hand_bone.position;

					if ( whoLastTouched.tag != "PlayerTeam1" ) {
				
						target_throw_in += new Vector3( 0,0,sphere.fHorizontal/10.0f);
					
						if (sphere.bPassButton) {
							candidateToThrowIn.GetComponent<Animation>().Play("saque_banda");
							state = InGameState.THROW_IN_DOING;
		
						}
						
					} else {
					
						timeToSaqueOponent -= Time.deltaTime;
					
						if ( timeToSaqueOponent < 0.0f ) {					
							timeToSaqueOponent = 3.0f;
							sphere.gameObject.GetComponent<Rigidbody>().isKinematic = true;
							candidateToThrowIn.GetComponent<Animation>().Play("saque_banda");
							state = InGameState.THROW_IN_DOING;
						}
					
					}
				
				break;	
				
				case InGameState.THROW_IN_DOING:
					
					candidateToThrowIn.GetComponent<Animation>()["saque_banda"].speed = 1.0f;

					if ( candidateToThrowIn.GetComponent<Animation>()["saque_banda"].normalizedTime < 0.5f && sphere.gameObject.GetComponent<Rigidbody>().isKinematic == true ) {
						sphere.gameObject.transform.position = candidateToThrowIn.GetComponent<Player_Script>().hand_bone.position;
					}

					if ( candidateToThrowIn.GetComponent<Animation>()["saque_banda"].normalizedTime >= 0.5f && sphere.gameObject.GetComponent<Rigidbody>().isKinematic == true ) {
						sphere.gameObject.GetComponent<Rigidbody>().isKinematic = false;
						sphere.gameObject.GetComponent<Rigidbody>().AddForce( candidateToThrowIn.transform.forward*4000.0f + new Vector3(0.0f, 1300.0f, 0.0f) );					
					} 
				
				
				
					if ( candidateToThrowIn.GetComponent<Animation>().IsPlaying("saque_banda") == false ) {
						state = InGameState.THROW_IN_DONE;
					}
				
				
				break;

				case InGameState.THROW_IN_DONE:
					candidateToThrowIn.GetComponent<Player_Script>().state = Player_Script.Player_State.MOVE_AUTOMATIC;
					state = InGameState.PLAYING;
				
				break;
				
				
				
				
				case InGameState.CORNER:
				
					whoLastTouched = lastTouched;	
				
					if ( whoLastTouched.tag == "GoalKeeper_Oponent" )
						whoLastTouched.tag = "OponentTeam";
					if ( whoLastTouched.tag == "GoalKeeper" )
						whoLastTouched.tag = "PlayerTeam1";
				
				
				
					// decidimos si es Corner o Saque de puerta
				
					if ( cornerTrigger.tag == "Corner_Oponent" && whoLastTouched.tag == "PlayerTeam1") {
						state = InGameState.GOAL_KICK;
						break;
					}
					if ( cornerTrigger.tag != "Corner_Oponent" && whoLastTouched.tag == "OponentTeam" ) {
						state = InGameState.GOAL_KICK;
						break;
					}
				
				
				
				
					foreach ( GameObject go in players ) {
						go.GetComponent<Player_Script>().state = Player_Script.Player_State.RESTING;
					}
					foreach ( GameObject go in oponents ) {
						go.GetComponent<Player_Script>().state = Player_Script.Player_State.RESTING;
					}
				
				
					sphere.owner = null;
				
					if ( whoLastTouched.tag == "PlayerTeam1" ) {
						PutPlayersInCornerArea( players, Player_Script.TypePlayer.DEFENDER );
						PutPlayersInCornerArea( oponents, Player_Script.TypePlayer.ATTACKER );
						candidateToThrowIn = SearchPlayerNearBall( oponents );
					}
					else {	
						PutPlayersInCornerArea( oponents, Player_Script.TypePlayer.DEFENDER );
						PutPlayersInCornerArea( players, Player_Script.TypePlayer.ATTACKER );
						candidateToThrowIn = SearchPlayerNearBall( players );
					}				
				
					candidateToThrowIn.transform.position = new Vector3 ( cornerSource.position.x, candidateToThrowIn.transform.position.y, cornerSource.position.z);
					
				
					if ( whoLastTouched.tag == "PlayerTeam1" ) {
					
						candidateToThrowIn.GetComponent<Player_Script>().temporallyUnselectable = true;
						candidateToThrowIn.GetComponent<Player_Script>().timeToBeSelectable = 1.0f;
				
						candidateToThrowIn.transform.LookAt( SearchPlayerNearBall( oponents ).transform.position);

					}
					else
						candidateToThrowIn.transform.LookAt( center ); 
	
				
	
				
					candidateToThrowIn.transform.Rotate(0, sphere.fHorizontal*10.0f, 0);
					candidateToThrowIn.GetComponent<Player_Script>().state = Player_Script.Player_State.CORNER_KICK;
				
					sphere.GetComponent<Rigidbody>().isKinematic = true;
//					sphere.gameObject.transform.position = candidateTosaqueBanda.GetComponent<Player_Script>().hand_bone.position;
				
					sphere.gameObject.transform.position = cornerSource.position;
				
				
					target_throw_in = candidateToThrowIn.transform.position + candidateToThrowIn.transform.forward;
				
				
					candidateToThrowIn.GetComponent<Animation>().Play("rest");
					state = InGameState.CORNER_CHASING;
				
				break;

					
			case InGameState.CORNER_CHASING:


				candidateToThrowIn.transform.LookAt( target_throw_in );
				candidateToThrowIn.GetComponent<Player_Script>().state = Player_Script.Player_State.CORNER_KICK;
				
				sphere.GetComponent<Rigidbody>().isKinematic = true;

				if ( whoLastTouched.tag != "PlayerTeam1" ) {
				
					target_throw_in += Camera.main.transform.right*(sphere.fHorizontal/10.0f);
					
					if (sphere.bPassButton) {
						candidateToThrowIn.GetComponent<Animation>().Play("backwards");
						state = InGameState.CORNER_DOING;
		
					}
						
				} else {
					
					timeToSaqueOponent -= Time.deltaTime;
					
					if ( timeToSaqueOponent < 0.0f ) {					
						timeToSaqueOponent = 3.0f;
						sphere.gameObject.GetComponent<Rigidbody>().isKinematic = true;
						candidateToThrowIn.GetComponent<Animation>().Play("backwards");
						state = InGameState.CORNER_DOING;
					}
					
				}

				
				
			break;

				
			case InGameState.CORNER_DOING:
			
				candidateToThrowIn.transform.position -= candidateToThrowIn.transform.forward * Time.deltaTime;
				
				if ( candidateToThrowIn.GetComponent<Animation>().IsPlaying("backwards") == false ) {
					
					candidateToThrowIn.GetComponent<Animation>().Play("saque_esquina");
					state = InGameState.CORNER_DOING_2;
				}
				
			break;				
				
				
			case InGameState.CORNER_DOING_2:
				

				if ( candidateToThrowIn.GetComponent<Animation>()["saque_esquina"].normalizedTime >= 0.5f && sphere.gameObject.GetComponent<Rigidbody>().isKinematic == true ) {
					sphere.gameObject.GetComponent<Rigidbody>().isKinematic = false;
					sphere.gameObject.GetComponent<Rigidbody>().AddForce( candidateToThrowIn.transform.forward*7000.0f + new Vector3(0.0f, 3300.0f, 0.0f) );					
				} 
				
				
				if ( candidateToThrowIn.GetComponent<Animation>().IsPlaying("saque_esquina") == false ) {
					state = InGameState.CORNER_DONE;
				}
				
				
				
			break;
				
				
				
			case InGameState.CORNER_DONE:
				
				candidateToThrowIn.GetComponent<Player_Script>().state = Player_Script.Player_State.MOVE_AUTOMATIC;				
				state = InGameState.PLAYING;
				
			break;
				
				
			case InGameState.GOAL_KICK:
				
				sphere.transform.position = goal_kick.position;
				sphere.gameObject.GetComponent<Rigidbody>().isKinematic = true;
				goalKeeper.transform.rotation = goal_kick.transform.rotation;
				goalKeeper.transform.position = new Vector3( goal_kick.transform.position.x, goalKeeper.transform.position.y ,goal_kick.transform.position.z)- (goalKeeper.transform.forward*1.0f);
				goalKeeper.GetComponent<GoalKeeper_Script>().state = GoalKeeper_Script.GoalKeeper_State.GOAL_KICK;
							
		
				foreach ( GameObject go in players ) {
					go.GetComponent<Player_Script>().state = Player_Script.Player_State.GO_ORIGIN;
				}
				foreach ( GameObject go in oponents ) {
					go.GetComponent<Player_Script>().state = Player_Script.Player_State.GO_ORIGIN;
				}
				
				sphere.owner = null;

			
				goalKeeper.GetComponent<Animation>().Play("backwards");	
				state = InGameState.GOAL_KICK_RUNNING;
				
				
			break;
			case InGameState.GOAL_KICK_RUNNING:
				
				goalKeeper.transform.position -= goalKeeper.transform.forward * Time.deltaTime;
				
				if ( goalKeeper.GetComponent<Animation>().IsPlaying("backwards") == false ) {
					goalKeeper.GetComponent<Animation>().Play("saque_esquina");	
					state = InGameState.GOAL_KICK_KICKING;
				}
			
				
			break;	
				
			case InGameState.GOAL_KICK_KICKING:
				
				goalKeeper.transform.position += goalKeeper.transform.forward * Time.deltaTime;

				if ( goalKeeper.GetComponent<Animation>()["saque_esquina"].normalizedTime >= 0.5f && sphere.gameObject.GetComponent<Rigidbody>().isKinematic == true) {
					sphere.gameObject.GetComponent<Rigidbody>().isKinematic = false;
					float force = Random.Range(5000.0f, 12000.0f);
					sphere.gameObject.GetComponent<Rigidbody>().AddForce( (goalKeeper.transform.forward*force) + new Vector3(0,3000.0f,0) );
				}
	
				if ( goalKeeper.GetComponent<Animation>().IsPlaying("saque_esquina") == false ) {

					goalKeeper.GetComponent<GoalKeeper_Script>().state = GoalKeeper_Script.GoalKeeper_State.GO_ORIGIN;	
					state = InGameState.PLAYING;
					
				}
				
			break;

			case InGameState.GOAL:
				
				
				foreach ( GameObject go in players ) {
					go.GetComponent<Player_Script>().state = Player_Script.Player_State.THROW_IN;
					go.GetComponent<Animation>().Play("rest");
				}
				foreach ( GameObject go in oponents ) {
					go.GetComponent<Player_Script>().state = Player_Script.Player_State.THROW_IN;
					go.GetComponent<Animation>().Play("rest");
				}
				
					keeper_oponent.GetComponent<GoalKeeper_Script>().state = GoalKeeper_Script.GoalKeeper_State.RESTING;
					keeper.GetComponent<GoalKeeper_Script>().state = GoalKeeper_Script.GoalKeeper_State.RESTING;
				
				timeToKickOff -= Time.deltaTime;
				
				if ( timeToKickOff < 0.0f ) {
					timeToKickOff = 4.0f;
					state = InGameState_Script.InGameState.PREPARE_TO_KICK_OFF;
				}
				
				
			break;


				
			case InGameState.KICK_OFF:
				
				
				foreach ( GameObject go in players ) {
					go.GetComponent<Player_Script>().state = Player_Script.Player_State.MOVE_AUTOMATIC;
					go.transform.position = go.GetComponent<Player_Script>().initialPosition;
				}
				foreach ( GameObject go in oponents ) {
					go.GetComponent<Player_Script>().state = Player_Script.Player_State.MOVE_AUTOMATIC;
					go.transform.position = go.GetComponent<Player_Script>().initialPosition;
				}
				
				keeper.GetComponent<GoalKeeper_Script>().state = GoalKeeper_Script.GoalKeeper_State.RESTING;
				keeper_oponent.GetComponent<GoalKeeper_Script>().state = GoalKeeper_Script.GoalKeeper_State.RESTING;
				
				sphere.owner = null;
				sphere.gameObject.transform.position = center.position;
				sphere.gameObject.GetComponent<Rigidbody>().drag = 0.5f;
				state = InGameState_Script.InGameState.PLAYING;
				
				break;


			case InGameState.PREPARE_TO_KICK_OFF:


				sphere.transform.position = center.position;



				foreach ( GameObject go in players ) {
					go.transform.LookAt( sphere.transform );
				}
				foreach ( GameObject go in oponents ) {
					go.transform.LookAt( sphere.transform );
				}


				if ( scoredbyvisiting  ) {

					passer.transform.position = sphere.transform.position + new Vector3( 0.0f, 0, 1.0f );
					passer.transform.LookAt( sphere.transform.position );
					passed.transform.position = passer.transform.position + (passer.transform.forward * 5.0f);
					passer.state = Player_Script.Player_State.KICK_OFFER;
					sphere.owner = passer.gameObject;
				}

				if ( scoredbylocal  ) {

					passer_oponent.transform.position = sphere.transform.position + new Vector3( 0.0f, 0, -1.0f );
					passer_oponent.transform.LookAt( sphere.transform.position );
					passed_oponent.transform.position = passer_oponent.transform.position + (passer_oponent.transform.forward * 5.0f);
					passer_oponent.state = Player_Script.Player_State.KICK_OFFER;
					sphere.owner = passer_oponent.gameObject;
				}

				
				scoredbylocal = false;
				scoredbyvisiting = false;
				
				break;
				
				
				
			}
		
		}
		
	}

	// Search player more close to the ball

	GameObject SearchPlayerNearBall( GameObject[] arrayPlayers) {
		
	    GameObject candidatePlayer = null;
		float distance = 1000.0f;
		foreach ( GameObject player in arrayPlayers ) {			
			
			if ( !player.GetComponent<Player_Script>().temporallyUnselectable ) {
				
				Vector3 relativePos = sphere.transform.InverseTransformPoint( player.transform.position );		
				float newdistance = relativePos.magnitude;
				
				if ( newdistance < distance ) {
				
					distance = newdistance;					
					candidatePlayer = player;					

				}
			}
			
		}
						
		return candidatePlayer;	
	}
	
	
	// Set players inside area to corner kick
	
	void PutPlayersInCornerArea( GameObject[] arrayPlayers, Player_Script.TypePlayer type) {
	
		
		foreach ( GameObject player in arrayPlayers ) {			
			
			if ( player.GetComponent<Player_Script>().type == type ) {
			
			
				float xmin = areaCorner.GetComponent<BoxCollider>().bounds.min.x;
				float xmax = areaCorner.GetComponent<BoxCollider>().bounds.max.x;
				float zmin = areaCorner.GetComponent<BoxCollider>().bounds.min.z;
				float zmax = areaCorner.GetComponent<BoxCollider>().bounds.max.z;
				
				float x = Random.Range( xmin, xmax );
				float z = Random.Range( zmin, zmax );
				
				player.transform.position = new Vector3( x, player.transform.position.y ,z);
				
				
			}
			
			
		}		
		
		
		
	}
	
	
	
}
