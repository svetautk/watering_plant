const buttonAddPlant = document.getElementById('button-add-plant')
const formModalWindow = document.getElementById('form-modal-window')
const newPlantForm = document.forms['new-plant-form']
const plantCardsBox = document.querySelector('.plant-cards-box')
const startPage = document.getElementById('start-page')
const inputDate = newPlantForm.elements.lastWaterDate
const buttonCancelForm = document.querySelector('.buttonCancelForm')

let plantsArray = []

buttonAddPlant.addEventListener('click', openNewPlantForm)
newPlantForm.addEventListener('submit', addNewPlant)
buttonCancelForm.addEventListener('click', closeForm)
formModalWindow.addEventListener('click', function(event) {
    let target = event.target.closest('.new-plant-form') 
    if (target) return
    closeForm()
})
plantCardsBox.addEventListener('click', deletePlantCard)
plantCardsBox.addEventListener('click', updateWateringDate)

class Plant {
    constructor(plantId, name, icon, waterPeriod, lastWaterDate) {
        this.plantId = plantId;
        this.name = name;
        this.icon = icon;
        this.waterPeriod = waterPeriod;
        this.lastWaterDate = lastWaterDate;
    }
}

function render() {
    // getPlantsFromStorage()
    let jsonPlantsArray = localStorage.getItem('plantsArray')
    if (!jsonPlantsArray || jsonPlantsArray === '[]') {
        startPage.classList.remove('hidden')
        plantCardsBox.classList.add('hidden')
    } else {
        plantCardsBox.classList.remove('hidden')
        plantCardsBox.innerHTML = ''

        try {
            plantsArray = JSON.parse(jsonPlantsArray)

            plantsArray.sort(function (a, b) {
            const firstDiff = calculateNextWaterDate(a.lastWaterDate, a.waterPeriod)
            const secondDiff = calculateNextWaterDate(b.lastWaterDate, b.waterPeriod)
            return firstDiff - secondDiff
            })

            plantsArray.forEach(function(plant) {
                const diff = calculateNextWaterDate(plant.lastWaterDate, plant.waterPeriod)
                const { delta, textPart1, textPart2, colorBlock } = updateInfo(diff)
                const cardHtml = `
                        <article data-id="${plant.plantId}" class="plant-card border border-black rounded-3xl p-4 relative">
                            <button data-delete class="absolute top-2 right-2 hover:bg-neutral-100 rounded-lg p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" 
                                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                            </button>
                            <div class="mt-6">
                                <p class="text-4xl">${plant.icon}</p>
                                <h3 class="font-semibold text-lg/8 mt-2">${plant.name}</h3>
                                <p class="text-xs text-neutral-600">water every <span>${plant.waterPeriod}</span> days</p>
                                <p class="mt-6 text-sm">
                                    <span>${textPart1}</span>
                                    <span class="${colorBlock} rounded-3xl px-4 py-1 ml-1">${delta}${textPart2}</span>
                                </p>
                                <button data-watering class="mt-4 rounded-3xl text-white text-sm/4 bg-emerald-500 hover:bg-emerald-600 px-8 py-2">
                                    Water now
                                </button>
                            </div>
                        </article>`;
            
                plantCardsBox.insertAdjacentHTML('beforeend', cardHtml)
            })

        } catch(err) {
            console.error(err)

            startPage.classList.remove('hidden')
            plantCardsBox.classList.add('hidden')
        } 
    }
}

function openNewPlantForm() {
    formModalWindow.classList.remove('hidden')
    inputDate.max = createTodayDateStr()
}

function closeForm() {
    newPlantForm.reset()
    formModalWindow.classList.add('hidden')
}

function addNewPlant(event) {
    event.preventDefault()

    let nameValue = newPlantForm.elements.plantName.value.trim()
    nameValue ||= 'Your plant'
    let iconValue = newPlantForm.elements.plantIcon.value
    iconValue ||= '🪴'
    let periodValue = newPlantForm.elements.waterPeriod.value
    periodValue ||= '7'
    let lastWaterDate = inputDate.value
    lastWaterDate ||= createTodayDateStr()
    let plantId = Date.now()

    const plant = new Plant(plantId, nameValue, iconValue, periodValue, lastWaterDate)

    // addNewPlantToStorage(plant)
    plantsArray.push(plant)
    let jsonPlantsArray = JSON.stringify(plantsArray)
    localStorage.setItem('plantsArray', jsonPlantsArray)

    closeForm()
    startPage.classList.add('hidden')
    render()  
}

function deletePlantCard(event) {

    let target = event.target.closest('[data-delete]')
    if (!target) {
        return
    }

    let plantCard = target.closest('article')
    let plantIdGoal = +plantCard.getAttribute('data-id')

    let indexDeleteObject = plantsArray.findIndex((plant) => plant.plantId === plantIdGoal)
    plantsArray.splice(indexDeleteObject, 1)
    let jsonPlantsArray = JSON.stringify(plantsArray)
    localStorage.setItem('plantsArray', jsonPlantsArray)
    render()
}

function updateWateringDate(event) {
    let target = event.target.closest('[data-watering]')
    if (!target) return
    
    let plantCard = target.closest('article')
    let plantIdGoal = +plantCard.getAttribute('data-id')

    let alreadyWatered = false

    plantsArray = plantsArray.map(function(plant) {

        if (plant.plantId === plantIdGoal) {

            if (plant.lastWaterDate === createTodayDateStr()) {
                alreadyWatered = true
            } else {
                plant.lastWaterDate = createTodayDateStr()
            }
        }
        return plant
    })

    let jsonPlantsArray = JSON.stringify(plantsArray)
    localStorage.setItem('plantsArray', jsonPlantsArray)

    if (alreadyWatered) {
        target.innerHTML = "You've already watered today"
    } else {
        render()
    }
}

function createTodayDateStr() {
    let today = new Date()
    let month = today.getMonth() + 1
    if (month < 10) {
        month = '0' + `${month}`
    }
    let day = today.getDate()
    if (day < 10) {
        day = '0' + `${day}`
    }
    return `${today.getFullYear()}-${month}-${day}`
}

function calculateNextWaterDate(lastWaterDateStr, waterPeriod) {
    let lastWaterDate = Date.parse(lastWaterDateStr)
    let todayDate = Date.parse(createTodayDateStr())
    return (+waterPeriod - (todayDate - lastWaterDate) / (1000 * 60 * 60 * 24))
}

function updateInfo(diff) {
    if (diff < -1) {
        return {
            delta: Math.abs(diff),
            textPart1: 'Should have watered ',
            textPart2: ' days ago',
            colorBlock: 'bg-orange-500/30',
        }
    }
    
    if (diff === -1) {
        return {
            delta: '',
            textPart1: 'Should have watered ',
            textPart2: 'yesterday',
            colorBlock: 'bg-orange-500/30',
        }
    }
    
    if (diff === 0) {
        return {
            delta: '',
            textPart1: 'Next watering ',
            textPart2: 'today',
            colorBlock: 'bg-yellow-300/30',
        }
    }
    
    if (diff === 1) {
        return {
            delta: '',
            textPart1: 'Next watering ',
            textPart2: 'tommorow',
            colorBlock: 'bg-emerald-500/30',
        }
    }

    return {
        delta: `in ${diff}`,
        textPart1: 'Next watering ',
        textPart2: ' days',
        colorBlock: 'bg-emerald-500/30',
    }
}

render()