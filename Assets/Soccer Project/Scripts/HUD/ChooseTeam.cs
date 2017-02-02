using UnityEngine;
using System.Collections;

public class ChooseTeam : MonoBehaviour {

	
	public Material normalMaterial;
	public Material selectMaterial;

	public ShieldMenu[] shields;

	public string Selected;
	public string localOrVisit;
	// Use this for initialization
	void Start () {


		if ( localOrVisit == "Local") {
			Selected = "Blue";
		} else {
			Selected = "Green";
		}
	
	}
	
	// Update is called once per frame
	void Update () {
	
		// control buttons in menu
		if ( Input.GetMouseButton(0) ) {

			Vector3 inputPos = Camera.main.ScreenToWorldPoint(Input.mousePosition);
			inputPos.z = 0;

			RaycastHit2D hit;
			hit = Physics2D.Raycast( inputPos, new Vector2( 0,0 ) );

			if ( hit.collider != null ) {

				foreach ( ShieldMenu shield in shields ) {

					if ( hit.collider == shield.GetComponent<BoxCollider2D>() ) {

						foreach ( ShieldMenu _shield in shields ) {
							_shield.GetComponent<Renderer>().material = normalMaterial; 
						}

						shield.GetComponent<Renderer>().material = selectMaterial;
						Selected = shield.nameTeam;
					}
				}
			}

			if ( hit.collider && hit.collider.tag == "playbutton" ) {

				PlayerPrefs.SetString( localOrVisit, Selected  );
				Application.LoadLevel("Football_match");

			}


		}




	}
}

