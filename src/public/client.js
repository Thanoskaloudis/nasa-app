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

const onSelect = ()=> {
    const selectedRover = document.getElementById("select").value;
    updateStore(store, { selectedRover: selectedRover })
}

const selectElement = (value, valueToSelect)=> {    
    let element = document.getElementById(value);
    element.value = valueToSelect;
}
window.onSelect = onSelect;

const updateStore = (store, newState) => {
    store = Object.assign(store, newState)
    render(root, store)
}

const render = async (root, state) => {
    root.innerHTML = App(state)
    selectElement("select", state.selectedRover);
}

const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateArr = date.split('-');
    const year = dateArr[0];
    const month = months[Number(dateArr[1])-1];
    const day = dateArr[2];
    return `${day} / ${month} / ${year}`;
}

// create content
const App = (state) => {
    let { rovers, roverNames, selectedRover, photos } = state

    return `
        <img class="background" src=${img} />
        <div class="header">
        <h1 class="header-text">Mars Rovers</h1>
        ${Select(roverNames, selectedRover)}
        </div>
        <main>
        ${RoverData(rovers, selectedRover, photos)}
        </main>
    `
}

window.addEventListener('load', () => {
    render(root, store)
})

const Select = (roverNames, selectedRover) => {
    return (
        `
                    <div class="select">
                    <select id="select" onchange="onSelect()">
                    ${roverNames.map((name) => {
                        return `
                        <option selected="${selectedRover == name}" value="${name}">${name}</option>
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
            <section class="rover-photo">
                <p> *The following photos were taken on ${formatDate(max_date)}.</p>
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
                <section class="rover-info">
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
