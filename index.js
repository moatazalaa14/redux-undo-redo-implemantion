//create unique id
function uniId() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (Math.random() * 16) | 0,
			v = c == 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

//Reducer for undo-redo

let undoable = (reducer) => {
	const initalState = {
		past: [],
		persent: reducer(undefined, {}),
		future: []
	};

	return function(state = initalState, action) {
		let { past, persent, future } = state;
		switch (action.type) {
			case 'UNDO': {
				let presentElem = past.pop();
				return {
					past: past,
					persent: presentElem,
					future: [ persent, ...future ]
				};
			}
			case 'REDO': {
				let futureElem = future.shift();
				let newFuture = future.slice(1);
				return {
					past: [ ...past, persent ],
					persent: futureElem,
					future: newFuture
				};
			}
			default: {
				const newPresent = reducer(persent, action);
				if (persent === newPresent) {
					return state;
				}
				return {
					past: [ ...past, persent ],
					persent: newPresent,
					future: []
				};
			}
		}
	};
};

//Reducer for movies
let movies = (state = [], action) => {
	switch (action.type) {
		case 'ADD_MOVIE': {
			let newState = [ ...state, action.info ];
			//createElem(action.info)
			return newState;
		}
		case 'ADD_DIRECTOR': {
			let { id } = action.info;
			return state.map((movie) => {
				if (id === movie.id) {
					movie.director.push(action.info.name);
				}
			});
		}
		case 'ADD_ACTOR': {
			let { id } = action.info;

			return state.map((movie) => {
				if (id === movie.id) {
					movie.actor = [ ...movie.actor, action.info.name ];
				}
			});
		}
		case 'CHANGE_MOVIE_TITLE':
			let { id, newTitle } = action.info;

			console.log(state);
			return state.map((movie) => {
				if (id === movie.id) {
					movie.title = newTitle;
				}
				return movie;
			});
		/*let { id, newTitle } = action.info;
      let newState=[...state]
      console.log(state)
      newState.map((movie) => {
        if (id === movie.id) {
          movie.title = newTitle;
          //createElem(action.info)
        }
      });
      return newState;*/

		case 'DELETE_MOVIE': {
			let { id } = action.info;
			return state.filter((item) => item.id !== id);
		}
		case 'SHOW_CHILD_FRIEND_MOVIE': {
			let newState = [ ...state ];

			return newState.filter((item) => item.rated === true);
		}

		case 'USER_ADD_RATE': {
			let { userId, rate, movieId } = action.info;
			return state.map((item) => {
				if (movieId === item.id) {
					item.rated.push({ rate: rate, userId: userId });
					item.usersWatched.push(userId);
					item.overall += rate;
					item.overall = item.overall / item.rated.length;
				}
			});
		}
		case 'GET_USERS_RATED': {
			let { movieId } = action.info;
			return state.rated.map((film) => {
				if (film.movieId === movieId) {
					film.usersWatched.push(movieId);
				}
			});
		}
		case 'GET_OVERALL_RATED': {
			let { movieId } = action.info;
			return state.rated.map((film) => {
				if (film.movieId === movieId) {
					overall += film.rate;
				}
			});
		}
		default: {
			return state;
		}
	}
};

//Reducer for Users
let users = (state = [], action) => {
	switch (action.type) {
		case 'ADD_USER': {
			let newState = [ ...state, action.info ];
			return newState;
		}
		case 'LOG_IN_USER': {
			let { userName, password } = action.info;
			return state.map((user) => {
				//user
				if (userName === user.userName && password === user.password) {
					user.isLogin = true;
				} else {
					user.isLogin = false;
				}
			});
		}
		case 'ADD_MOVIE_INTO_FEVS': {
			let { movieId, userId } = action.info;

			return state.map((user) => {
				user.moviesFev.push({ movieId: movieId });
			});
		}
		case 'ADD_MOVIE_INTO_Watched_LIST': {
			let { movieId, userId } = action.info;
			return state.map((user) => {
				user.watchedList = [ ...user.watchedList, { movieId: movieId } ];
			});
		}
		case 'START_WATCHING_DURATION': {
			let { userId, movieId } = action.info;
			return state.map((user) => {
				if (userId === user.userId && !user.isWorking) {
					user.isWorking = true;
					user.filmInfo = [
						...user.filmInfo,
						{
							starting: Date.now(),
							movieId: movieId,
							stop: 0
						}
					];
				}
			});
		}
		case 'STOP_WATCHING_DURATION': {
			let { userId, movieId } = action.info;

			return state.map((user) => {
				if (userId === user.userId && user.isWorking) {
					user.isWorking = false;
					user.filmInfo.map((onlyFilm) => {
						if (movieId === onlyFilm.movieId) {
							onlyFilm.stop = Date.now();
							onlyFilm.duaration = (onlyFilm.stop - onlyFilm.starting) / 6000 + 'min';
						}
					});
				}
			});
		}
		default: {
			return state;
		}
	}
};

//store
const createStore = (reducer) => {
	let state;
	let listeners = [];

	const getState = () => state;
	const dispatch = (action) => {
		state = reducer(state, action);
		listeners.forEach((listener) => listener());
	};
	const subscribe = (listener) => {
		listeners.push(listener);
		return () => {
			listeners = listeners.filter((l) => l !== listener);
		};
	};
	dispatch({});
	return { getState, dispatch, subscribe };
};

//let store=createStore(movies)

const showAllMovies = () => {
	return store.getState();
};

const showAllUsers = () => {
	return store.getState().users;
};

const combineReducer = (reducers) => {
	return (state = {}, action) => {
		return Object.keys(reducers).reduce((nextState, key) => {
			nextState[key] = reducers[key](state[key], action);
			return nextState;
		}, {});
	};
};

const RootReducers = combineReducer({
	movies,
	users
});

const undoableMovies = undoable(movies);

const store = createStore(undoableMovies);

/*const createElem=(content)=>{
  console.log(content)
  const parent=document.createElement("DIV")
  const child=document.createElement("P")
  const list=document.createElement("UL")

  const cards=content.title;
  parent.innerHTML=cards;
  child.innerHTML=content.desc;
  const actors=content.actor.forEach((act,i) => {
    const item=document.createElement("Li")
    item.innerHTML=act

    list.appendChild(item)
    
  });
  parent.appendChild(child)
  parent.appendChild(list)
  parent.className="filmCard"
  document.querySelector(".content").appendChild(parent)
  console.log(store.getState())
}*/

const render = () => {
	let content = '';
	showAllMovies().persent.forEach((movie) => {
		content += `<div>
          <h2>${movie.title}</h2>
          <p>${movie.desc}</p>
        
        </div>`;
	});
	return content;
};

store.subscribe(() => {
	document.querySelector('.content').innerHTML = render();
});
//store.subscribe(()=>render)
const undoAction = () => {
	store.dispatch({
		type: 'UNDO'
	});
};
const redoAction = () => {
	store.dispatch({
		type: 'REDO'
	});
};

document.querySelector('.undo').addEventListener('click', () => {
	console.log('undoable');
	undoAction();
});
document.querySelector('.redo').addEventListener('click', () => {
	console.log('redoable');
	redoAction();
});

const moviesActions = {
	addMovie: (
		movieName,
		director = [],
		actor = [],
		rated = [],
		usersWatched = [],
		overall = 0,
		desc = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam'
	) => {
		store.dispatch({
			type: 'ADD_MOVIE',
			info: {
				id: uniId(),
				title: movieName,
				director: director,
				actor: actor,
				rated: rated,
				usersWatched: usersWatched,
				overall: overall,
				desc: desc
			}
		});
	},
	addRate: (id, rate, userId) => {
		store.dispatch({
			type: 'ADD_RATE',
			info: {
				id: id,
				rate: rate,
				userId: uniId()
			}
		});
	},
	addDirector: (id, directorName) => {
		store.dispatch({
			type: 'ADD_DIRECTOR',
			info: {
				id: id,
				name: directorName
			}
		});
	},
	addActor: (id, actorName) => {
		store.dispatch({
			type: 'ADD_ACTOR',
			info: {
				id: id,
				name: actorName
			}
		});
	},
	changeMovieTitle: (id, newTitle) => {
		store.dispatch({
			type: 'CHANGE_MOVIE_TITLE',
			info: {
				id: id,
				newTitle: newTitle
			}
		});
	},
	deleteMovie: (id) => {
		store.dispatch({
			type: 'DELETE_MOVIE',
			info: {
				id: id
			}
		});
	},
	getUsersRated: (movieId) => {
		store.dispatch({
			type: 'GET_USERS_RATED',
			info: {
				movieId: movieId
			}
		});
	},
	getOverallRated: (movieId) => {
		store.dispatch({
			type: 'GET_OVERALL_RATED',
			info: {
				movieId: movieId
			}
		});
	}
};

const usersActions = {
	addUser: (
		userName,
		email,
		password,
		isLogin = false,
		moviesFev = [],
		watchedList = [],
		filmInfo = [],
		isWorking = false
	) => {
		store.dispatch({
			type: 'ADD_USER',
			info: {
				userId: uniId(),
				userName: userName,
				email: email,
				password: password,
				isLogin: isLogin,
				moviesFev: moviesFev,
				watchedList: watchedList,
				filmInfo: filmInfo,
				isWorking: isWorking
			}
		});
	},
	logInUser: (userName, password) => {
		store.dispatch({
			type: 'LOG_IN_USER',
			info: {
				userName: userName,
				password: password
			}
		});
	},
	userAddRate: (userId, rate, movieId) => {
		store.dispatch({
			type: 'USER_ADD_RATE',
			info: {
				userId: userId,
				rate: rate,
				movieId: movieId
			}
		});
	},
	AddFilmIntoFevs: (movieId, userId) => {
		store.dispatch({
			type: 'ADD_MOVIE_INTO_FEVS',
			info: {
				movieId: movieId,
				userId: userId
			}
		});
	},
	addFilmIntoWatchedList: (movieId, userId) => {
		store.dispatch({
			type: 'ADD_MOVIE_INTO_Watched_LIST',
			info: {
				movieId: movieId,
				userId: userId
			}
		});
	},
	startWatchingMovies: (userId, movieId) => {
		store.dispatch({
			type: 'START_WATCHING_DURATION',
			info: {
				userId: userId,
				movieId: movieId
			}
		});
	},
	stopWatchingMovies: (userId, movieId) => {
		store.dispatch({
			type: 'STOP_WATCHING_DURATION',
			info: {
				userId: userId,
				movieId: movieId
			}
		});
	}
};
