#pragma strict

var rotAmount : int;

function DoRandomRotate () {
	rotAmount = Random.Range(-40, 40);
	transform.rotation = Quaternion.Euler(0, rotAmount, 0);
}
