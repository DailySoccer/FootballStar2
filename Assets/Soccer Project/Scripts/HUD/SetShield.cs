using UnityEngine;
using System.Collections;

public class SetShield : MonoBehaviour {

	public string localOrVisiting;

	// Use this for initialization
	void Start () {
	
		// change sprite in Shields
		string nameTeam = PlayerPrefs.GetString( localOrVisiting );
		Sprite spr = Resources.Load<Sprite>("Textures/" + "Shield_" + nameTeam);
		SpriteRenderer sprRenderer= (SpriteRenderer)GetComponent<Renderer>();
		sprRenderer.sprite = spr;

	}
	
	// Update is called once per frame
	void Update () {
	
	}
}
