using UnityEngine;
using System.Collections;

public class Banda_Script : MonoBehaviour {
	
	public Sphere sphere;
	public Vector3 direction_throwin;
	
	// Use this for initialization
	void Start () {
		
		sphere = (Sphere)GameObject.FindObjectOfType( typeof(Sphere) );		
	}
	
	// Update is called once per frame
	void Update () {
	
	}
	

	void OnTriggerEnter( Collider other) {


		// Detect if Players are outside of field
		if ( (other.gameObject.tag == "PlayerTeam1" || other.gameObject.tag == "OponentTeam") && Camera.main.GetComponent<InGameState_Script>().state == InGameState_Script.InGameState.PLAYING ) {
		
			if ( other.gameObject != sphere.owner ) {
			
				other.gameObject.GetComponent<Player_Script>().temporallyUnselectable = true;
				other.gameObject.GetComponent<Player_Script>().timeToBeSelectable = 0.5f;
				other.gameObject.GetComponent<Player_Script>().state = Player_Script.Player_State.GO_ORIGIN;
			}
			
		}

		// Detect if Ball is outside
		if ( other.gameObject.tag == "Ball" && Camera.main.GetComponent<InGameState_Script>().state == InGameState_Script.InGameState.PLAYING ) {
			
			sphere.owner = null;
			Camera.main.GetComponent<InGameState_Script>().timeToChangeState = 2.0f;
			Camera.main.GetComponent<InGameState_Script>().state = InGameState_Script.InGameState.THROW_IN;
			Camera.main.GetComponent<InGameState_Script>().positionSide = sphere.gameObject.transform.position;		
			
		}
		
		
		
	}
	
	
}
