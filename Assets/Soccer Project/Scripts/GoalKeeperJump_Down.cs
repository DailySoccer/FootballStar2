using UnityEngine;
using System.Collections;

public class GoalKeeperJump_Down : MonoBehaviour {

	public GoalKeeper_Script goalKeeper;
	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
	
	}
	
	
	void OnTriggerEnter( Collider other ) {
	

		// Box triggers are used to know if goalkeeper need to throw to catch the ball
		if ( other.tag == "Ball" ) {
		
			Vector3 dir_goalkeeper = goalKeeper.transform.forward;
			Vector3 dir_ball = other.gameObject.GetComponent<Rigidbody>().velocity;
			dir_ball.Normalize();
			
			float det = Vector3.Dot( dir_goalkeeper, dir_ball );
						
			Debug.Log("det " + Mathf.Acos(det) * 57.0f + " speed " + other.gameObject.GetComponent<Rigidbody>().velocity.magnitude);
			float degree = Mathf.Acos(det) * 57.0f;
			
			if ( degree > 90.0f && degree < 270.0f && other.gameObject.GetComponent<Rigidbody>().velocity.magnitude > 5.0f && !other.gameObject.GetComponent<Rigidbody>().isKinematic) {			

				if ( tag == "GoalKeeper_Jump_Left" ) {
				
					goalKeeper.state = GoalKeeper_Script.GoalKeeper_State.JUMP_LEFT_DOWN;
					goalKeeper.gameObject.GetComponent<Animation>().Play("goalkeeper_clear_left_down");
				
					
//					Debug.Log("Left");
				}
	
				if ( tag == "GoalKeeper_Jump_Right" ) {
	
					goalKeeper.state = GoalKeeper_Script.GoalKeeper_State.JUMP_RIGHT_DOWN;
					goalKeeper.gameObject.GetComponent<Animation>().Play("goalkeeper_clear_right_down");
					
//					Debug.Log("Right");
	
				}
		
			}
		
		}
		
		
	}
	
}
