import { set } from 'immutable'
import './assets/stylesheets/resets.css'
import './assets/stylesheets/index.css'
import img from './assets/images/background.jpg'

let store = {
    apod: '',
    roverNames: ['Perseverance', 'Curiosity', 'Spirit', 'Opportunity' ],
    rovers: {},
    selectedRover: 'Perseverance',
    photos: {},
}

// add our markup to the page
const root = document.getElementById('root')

function onSelect () {
    const selectedRover = document.getElementById("select").value;
    updateStore(store, { selectedRover: selectedRover })
}
window.onSelect = onSelect

const updateStore = (store, newState) => {
    store = Object.assign(store, newState)
    render(root, store)
}

const render = async (root, state) => {
    root.innerHTML = App(state)
}

const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateArr = date.split('-');
    const year = dateArr[0];
    const month = months[Number(dateArr[1])-1];
    const day = dateArr[2];
    return `${month} ${day} ${year}`;
}

// create content
const App = (state) => {
    let { rovers, roverNames, selectedRover, photos } = state

    return `
        <img class="background" src=${img} />
        <header>
        <div class="banner">
        <h1 class="banner-text">Mars Rovers</h1>
        </div>
        ${Select(roverNames)}
        </header>
        <main>
        ${RoverData(rovers, selectedRover, photos)}
        </main>
        <footer>
            <h6>
                This page was made possible by the <a href="https://api.nasa.gov/">NASA API</a>.
            </h6>
        </footer>
    `
}

window.addEventListener('load', () => {
    render(root, store)
})

const Tab = (name, selectedRover) => {
    const className = name === selectedRover ? 'active' : 'inactive';

    return `
        <div class="nav-tab ${className}">
            <a href="#" id="${name}" class="nav-link" onclick="onSelect()">${name}</a> 
        </div>
    `
}


const Select = (roverNames) => {
    return (
        `
                    <div class="select">
                    <select id="select" onchange="onSelect">
                    ${roverNames.map((name, index) => {
                        return `
                        <option value="${index}" value="${name}">${name}</option>
                        `
                    })}
                    </select>
                    </div>

        `
    )
}

const RoverPhotos = (rover_name, max_date, photos) => {
    const rover = Object.keys(photos).find(key => key === rover_name)

    if (!rover) {
        getLatestRoverPhotos(rover_name)
    }

    const roverPhotos = store.photos[rover_name]

    if (roverPhotos) {
        return `
            <section>
                <p>Check out some awasome photos from ${rover_name}. The following photos were taken on ${formatDate(max_date)}.</p>
                <div class="photos">
                    ${roverPhotos.map(photo => (
                        `<img class="rover-img" src=${photo.img_src} width=300px/>` 
                    )).join('')}
                </div>
            </section>
        `
    }
    return `
        <section>
            <div> Loading Photos... </div>
        </section>`
}

const RoverData = (rovers, selectedRover, photos) => {
    const rover = Object.keys(rovers).find(key => key === selectedRover)

    if (!rover) {
        getRoverData(selectedRover)
    }

    const roverToDisplay = rovers[selectedRover];

    if (roverToDisplay) {
        return (
            `
                <section>
                    <p><b>Launched:</b> ${formatDate(roverToDisplay.launch_date)}</p>
                    <p><b>Landed:</b> ${formatDate(roverToDisplay.landing_date)}</p>
                    <p><b>Status:</b> ${roverToDisplay.status.toUpperCase()}</p>
                </section>
                    
                ${RoverPhotos(roverToDisplay.name, roverToDisplay.max_date, photos)}
            `
        )
    } 
    return `<div> Loading Data... </div>`
}

// ------------------------------------------------------  API CALLS

const getRoverData = (rover_name) => {
    fetch(`http://localhost:3000/rovers/${rover_name}`)
        .then(res => res.json())
        .then(({ photo_manifest }) => updateStore(store, 
            {
                rovers: set(store.rovers, rover_name, {
                    ...store.rovers[rover_name],
                    ...photo_manifest
                })
            },
        ))
        fetch(`http://localhost:3000/rovers`)
        .then(res => res.json())
        .then(() => console.log(res))
}

const getLatestRoverPhotos = (rover_name) => {
    fetch(`http://localhost:3000/rover_photos/${rover_name}`)
        .then(res => res.json())
        .then(({ latest_photos }) => {
            updateStore(store, {
                photos: {
                    ...store.photos,
                    [rover_name]: [...latest_photos],
                }
            }
        )})
}
