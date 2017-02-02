using UnityEngine;
using System.Collections;

public class Goal_Script : MonoBehaviour {
	
	public Sphere sphere;
	public GameObject goalKeeper;
	public InGameState_Script ingame;
	public MeshFilter red;
	private Vector3[] arrayOriginalVertices;	
	
	// Use this for initialization
	void Start () {
		// get ball  in scene
		sphere = (Sphere)GameObject.FindObjectOfType( typeof(Sphere) );	

		// get net vertex to modify them
		arrayOriginalVertices = new Vector3[ red.mesh.vertices.Length ];
		
		for (int f=0; f< red.mesh.vertices.Length; f++) {
			arrayOriginalVertices[f] = red.mesh.vertices[f];
		}	
	}
	
	// Update is called once per frame
	void Update () {
	
	}
	
	void OnTriggerEnter( Collider other) {

		// if ball is inside then is GOAL
		if ( other.gameObject.tag == "Ball" /*&& Camera.main.GetComponent<InGameState_Script>().state == InGameState_Script.InGameState.PLAYING*/ ) {
			
			sphere.owner = null;
			
			goalKeeper.GetComponent<GoalKeeper_Script>().state = GoalKeeper_Script.GoalKeeper_State.GOAL_KICK;
			goalKeeper.GetComponent<Animation>().PlayQueued("rest");

			// add score depending of goal side
			if ( goalKeeper.tag == "GoalKeeper_Oponent" && ingame.state != InGameState_Script.InGameState.GOAL) {
				ingame.score_local++;
				ingame.scoredbylocal = true;
				ingame.scoredbyvisiting = false;
			} 
			
			if ( goalKeeper.tag == "GoalKeeper" && ingame.state != InGameState_Script.InGameState.GOAL) {			
				ingame.score_visiting++;
				ingame.scoredbylocal = false;
				ingame.scoredbyvisiting = true;
			}
			
			
			Camera.main.GetComponent<InGameState_Script>().timeToChangeState = 2.0f;
			Camera.main.GetComponent<InGameState_Script>().state = InGameState_Script.InGameState.GOAL;
		}
		
		
		
	}
	void OnTriggerStay( Collider other ) {
	
		
		// Deform the net ( if you are working for web/standalone you could use real cloth
		if ( other.gameObject.tag == "Ball" ) {

			Mesh meshRed = red.mesh;
			
			int numberVertex = meshRed.vertexCount;
			Vector3[] arrayVertices = meshRed.vertices;
			
	
			for ( int i=0; i<numberVertex; i++) {
						
				Vector3 worldPos = red.transform.TransformPoint( arrayOriginalVertices[i] );
							
				float distance = (worldPos-other.transform.position).magnitude;
				
				if ( distance < 3.0f ) {

					Vector3 destLocal = red.transform.InverseTransformPoint( other.transform.position );
					Vector3 sourceLocal = arrayOriginalVertices[i];					
					Vector3 dirLocal = (destLocal-sourceLocal);
				
				
					if (  Vector3.Dot( dirLocal, meshRed.normals[i] ) > 0.0f  ) {
				
		
//						float tension = 0.0f;
//						Color color;
						if (distance <= 3.0 && distance > 2.0f) {
//							tension = 1.5f;
//							color = Color.red;
						}

						if (distance <= 2.0 && distance > 1.0f) {
//							tension = 0.5f;
//							color = Color.green;

						}
					
						if (distance <= 1.0 && distance >= 0.0f) {
//							tension = 0.1f;
//							color = Color.blue;

						}
					
						Vector3 finalLocal = sourceLocal + (dirLocal/(distance+0.1f));
						arrayVertices[i] = finalLocal; 

					
					} else {
						arrayVertices[i] = arrayOriginalVertices[i];					
					}
					
				} else {
				
					arrayVertices[i] = arrayOriginalVertices[i];
				}
				
				
				
			}
		
		
			meshRed.vertices = arrayVertices;
		
		}		
		
	}
	
	
}
