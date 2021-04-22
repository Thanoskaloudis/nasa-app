import { set } from 'immutable'
import './assets/stylesheets/resets.css'
import './assets/stylesheets/index.css'
import img from './assets/images/background.jpg'

let store = {
    user: { name: 'Student' },
    apod: '',
    roverNames: ['Perseverance', 'Curiosity', 'Spirit', 'Opportunity' ],
    rovers: {},
    selectedRover: 'Perseverance',
    photos: {},
}

// add our markup to the page
const root = document.getElementById('root')

function onSelectTab (selectedTab) {
    updateStore(store, { selectedRover: selectedTab })
}
window.onSelectTab = onSelectTab

const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateArr = date.split('-')
    const year = dateArr[0]
    const month = months[Number(dateArr[1])-1]
    const day = dateArr[2]
    return `${month} ${day} ${year}`
}

const updateStore = (store, newState) => {
    store = Object.assign(store, newState)
    render(root, store)
}

const render = async (root, state) => {
    root.innerHTML = App(state)
}

// create content
const App = (state) => {
    let { rovers, roverNames, selectedRover, photos } = state

    return `
        <header>
            <div class="banner">
                <img class="banner-img" src=${img} />
                <h1 class="banner-text">Mars Rovers</h1>
            </div>
            ${Nav(roverNames, selectedRover)}
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

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    render(root, store)
})

// ------------------------------------------------------  COMPONENTS
// Example of a pure function that renders infomation requested from the backend
const ImageOfTheDay = (apod) => {

    // If image does not already exist, or it is not from today -- request it again
    const today = new Date()
    const photodate = new Date(apod.date)

    if (!apod || apod.date === today.getDate() ) {
        getImageOfTheDay(store)
    }

    // check if the photo of the day is actually type video!
    if (apod.media_type === "video") {
        return (`
            <p>See today's featured video <a href="${apod.url}">here</a></p>
            <p>${apod.title}</p>
            <p>${apod.explanation}</p>
        `)
    } else {
        return (`
            <img src="${apod.image.url}" height="350px" width="100%" />
            <p>${apod.image.explanation}</p>
        `)
    }
}

const Tab = (name, selectedRover) => {
    const className = name === selectedRover ? 'active' : 'inactive';

    return `
        <div class="nav-tab ${className}">
            <a href="#" id="${name}" class="nav-link" onclick="onSelectTab(id)">${name}</a> 
        </div>
    `
}


const Nav = (roverNames, selectedRover) => {
    return (
        `
            <nav class="nav-container">
                ${roverNames.map((name) => {
                    return `
                        ${Tab(name, selectedRover)}
                    `
                }).join('')}
            </nav>
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

// Example API call
const getImageOfTheDay = (state) => {
    let { apod } = state

    fetch(`http://localhost:3000/apod`)
        .then(res => res.json())
        .then(apod => updateStore(store, { apod }))
}

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
