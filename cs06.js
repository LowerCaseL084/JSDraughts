const PIECE_RADIUS = 24;
const docBoard = document.getElementById('board');
const mainDoc = document.getElementById('main');
const startButton = document.getElementById('start_button');
const message = document.getElementById('message');

// -1 for white, 1 for red
const startBoard = 
[
	[ 0, -1, 0, -1, 0, -1, 0, -1],
	[ -1, 0, -1, 0, -1, 0, -1, 0],
	[ 0, -1, 0, -1, 0, -1, 0, -1],
	[ 0, 0, 0, 0, 0, 0, 0, 0],
	[ 0, 0, 0, 0, 0, 0, 0, 0],
	[ 1, 0, 1, 0, 1, 0, 1, 0],
	[ 0, 1, 0, 1, 0, 1, 0, 1],
	[ 1, 0, 1, 0, 1, 0, 1, 0],
];

var currentColour = "red";
var selectedPiece = null;
var acceptableSquares = [];
var jumpSquares = [];
var jumpDelPieces = [];
var numberOfWhites = 12;
var numberOfReds = 12;

startButton.addEventListener("click", StartGame);

/*
	Starts the game. Creates the board and the pieces.
*/
function StartGame()
{
	currentColour = "red";
	acceptableSquares = [];
	jumpSquares = [];
	jumpDelPieces = [];
	selectedPiece = null;
	startButton.textContent = 'Reset';
	numberOfWhites = 12;
	numberOfReds = 12;
	docBoard.textContent = "";

	// Create the board
	for (let i=0; i<8; i++)
	{
		for (let j=0; j<8; j++)
		{
			// Add the squares
			let square = document.createElement("div");
			square.classList.add("square");
			square.id = ("square_"+j+i);
			square.setAttribute("board_x",j);
			square.setAttribute("board_y",i);
			square.setAttribute("unselectable","on");
			square.classList.add((i+j)%2 == 0? "light_square": "dark_square");

			// Add events for piece drag and drop
			square.addEventListener('dragenter', PieceDragEnter, true);
			square.addEventListener('dragover', PieceDragOver, true);
			square.addEventListener('drop', PieceDrop, true);
			docBoard.appendChild(square);

			// Add the pieces
			if(startBoard[i][j] != 0)
			{
				let piece = document.createElement("div");
				piece.classList.add("piece");
				piece.classList.add("normal_piece");
				piece.classList.add(startBoard[i][j] == -1? "white_piece": "red_piece");
				//piece.id = ("piece_"+i+j);	
				piece.setAttribute("unselectable","on");
				piece.setAttribute("draggable","true");

				piece.addEventListener("dragstart", PieceDragStart, true);
				square.appendChild(piece);
			}
		}
	}
}

/*
	Mouse Down Event for pieces
*/
function PieceDragStart(event)
{
	if(event.currentTarget.classList.contains(""+currentColour+"_piece"))
	{
		message.innerHTML = "";
		event.dataTransfer.setData("draughts/piece", event.target);
		event.dataTransfer.effectAllowed = 'move';
		selectedPiece = event.currentTarget;
		const startingLocation = {

            x : Number(event.currentTarget.parentNode.getAttribute('board_x')),
            y : Number(event.currentTarget.parentNode.getAttribute('board_y'))

        };
		acceptableSquares = [];
		jumpDelPieces = [];
		jumpSquares = [];

		let up = false;
		let down = false;
		if(currentColour == "red" || event.currentTarget.classList.contains('king_piece'))
			up = true;
		if(currentColour == "white" || event.currentTarget.classList.contains('king_piece'))
			down = true;
		CheckJumps(startingLocation,up,down);
		if(jumpSquares.length == 0)
		{
			for(let i=0; i<8; i++)
			{
				for(let j=0; j<8; j++)
				{
					let square = document.getElementById("square_"+i+j);
					if(square.firstChild != null)
					{
						if(square.firstChild.classList.contains(""+currentColour+"_piece"))
						{
							up = false;
							down = false;
							if(currentColour == "red" || square.firstChild.classList.contains('king_piece'))
								up = true;
							if(currentColour == "white" || square.firstChild.classList.contains('king_piece'))
								down = true;
							CheckJumps({x:i, y:j},up,down);
						}
					}
				}
			}
			if(jumpSquares.length != 0)
			{
				message.innerHTML = "You need to jump!";
				event.preventDefault();
				return;
			}

			acceptableSquares = [];
			// Check immediate diagonals
			up = false;
			down = false;
			if(currentColour == "red" || event.currentTarget.classList.contains('king_piece'))
				up = true;
			if(currentColour == "white" || event.currentTarget.classList.contains('king_piece'))
				down = true;
			CheckAdjacent(startingLocation,up,down);
		}
	}
	else
	{
		message.innerHTML = "Not your turn!";
		event.preventDefault();
	}
}

function PieceDragEnter(event)
{
	/*if(selectedPiece == null)
		return;*/

	if((jumpSquares.length == 0 && acceptableSquares.includes(event.currentTarget))
		|| jumpSquares.includes(event.currentTarget))
		event.preventDefault();
}

function PieceDragOver(event)
{
	/*if(selectedPiece == null)
		return;*/
	event.dataTransfer.dropEffect = 'move';
	event.preventDefault();
}

function PieceDrop(event)
{
	/*if(selectedPiece == null)
		return;*/
	let jumps = jumpSquares.includes(event.currentTarget);
	if((jumpSquares.length == 0 && acceptableSquares.includes(event.currentTarget))
		|| jumps)
	{
		selectedPiece.parentNode.removeChild(selectedPiece);
		event.currentTarget.appendChild(selectedPiece);
		if(jumps)
		{
			let index = jumpSquares.indexOf(event.currentTarget);
			jumpDelPieces[index].removeChild(jumpDelPieces[index].firstChild);
			if(currentColour == "red")
			{
				numberOfWhites--;
				if(numberOfWhites == 0)
				{
					message.innerHTML = "Red won!";
					EndGame();
					event.preventDefault();
					return;
				}
			}
			else
			{
				numberOfReds--;
				if(numberOfReds == 0)
				{
					message.innerHTML = "White won!";
					EndGame();
					event.preventDefault();
					return;
				}
			}
		}
		jumpDelPieces = [];
		jumpSquares = [];

		if(currentColour == "red" && Number(event.currentTarget.getAttribute("board_y")) == 0)
			selectedPiece.classList.add('king_piece');
		else if(currentColour == "white" && Number(event.currentTarget.getAttribute("board_y")) == 7)
		selectedPiece.classList.add('king_piece');

		if(jumps)
		{
			let up = false;
			let down = false;
			if(currentColour == "red" || selectedPiece.classList.contains('king_piece'))
				up = true;
			if(currentColour == "white" || selectedPiece.classList.contains('king_piece'))
				down = true;
			CheckJumps({
				x: Number(event.currentTarget.getAttribute("board_x")),
				y: Number(event.currentTarget.getAttribute("board_y")),
			}, up, down);
			if(jumpSquares.length == 0)
				currentColour = (currentColour == 'red')?'white':'red';
		}
		else
		{
			currentColour = (currentColour == 'red')?'white':'red';
			jumpSquares = [];
			jumpDelPieces = [];
			acceptableSquares = [];

			let up = false;
			let down = false;
			if(currentColour == "red" || event.currentTarget.classList.contains('king_piece'))
				up = true;
			if(currentColour == "white" || event.currentTarget.classList.contains('king_piece'))
				down = true;

			for(let i=0; i<8; i++)
			{
				for(let j=0; j<8; j++)
				{
					let square = document.getElementById("square_"+i+j);
					if(square.firstChild != null)
					{
						if(square.firstChild.classList.contains(""+currentColour+"_piece"))
						{
							up = false;
							down = false;
							if(currentColour == "red" || square.firstChild.classList.contains('king_piece'))
								up = true;
							if(currentColour == "white" || square.firstChild.classList.contains('king_piece'))
								down = true;
							CheckJumps({x:i, y:j},up,down);
							CheckAdjacent({x:i, y:j},up,down);
						}
					}
				}
			}
			if(acceptableSquares.length == 0 && jumpSquares.length == 0)
			{
				message.innerHTML = "Draw!";
				EndGame();
			}
		}
		selectedPiece = null;
		event.preventDefault();
	}
	//startingLocation = {x:0, y:0};
}

function CheckJumps(position, up, down)
{
	for(let y=-1; y<2; y+=2)
	{
		if(y == -1 && (!up || position.y<=1))
			continue;
		if(y == 1  && (!down || position.y>=6))
			continue;

		for(let x=-1; x<2; x+=2)
		{
			if(((x<0 && position.x > 1) || (x>0 && position.x < 6)))
			{
				let dsquare = document.getElementById("square_"+(position.x+2*x)+(position.y+2*y));
				let csquare = document.getElementById("square_"+(position.x+x)+(position.y+y));
				if(csquare.firstChild != null && dsquare.firstChild == null)
				{
					if(!csquare.firstChild.classList.contains(""+currentColour+"_piece"))
					{
						jumpSquares.push(dsquare);
						jumpDelPieces.push(csquare);
					}
				}
			}
		}
	}
}

function CheckAdjacent(startingLocation, up, down)
{
	if(startingLocation.x<7)
	{
		// TR
		if(startingLocation.y>0 && up)
		{
			let square = document.getElementById("square_"+(startingLocation.x+1)+(startingLocation.y-1));
			if(square.firstChild == null)
				acceptableSquares.push(square);
		}
		// DR
		if(startingLocation.y<7 && down)
		{
			let square = document.getElementById("square_"+(startingLocation.x+1)+(startingLocation.y+1));
			if(square.firstChild == null)
				acceptableSquares.push(square);
		}
	}
	if(startingLocation.x>0)
	{
		// TL
		if(startingLocation.y>0 && up)
		{
			let square = document.getElementById("square_"+(startingLocation.x-1)+(startingLocation.y-1));
			if(square.firstChild == null)
				acceptableSquares.push(square);
		}
		// DL
		if(startingLocation.y<7 && down)
		{
			let square = document.getElementById("square_"+(startingLocation.x-1)+(startingLocation.y+1));
			if(square.firstChild == null)
				acceptableSquares.push(square);
		}
	}
}

function EndGame()
{
	currentColour = "red";
	acceptableSquares = [];
	jumpSquares = [];
	jumpDelPieces = [];
	selectedPiece = null;
	startButton.textContent = 'Start';
	numberOfWhites = 12;
	numberOfReds = 12;

	docBoard.textContent = "";
}