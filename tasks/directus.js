var { Directus } = require('@directus/sdk');
const { mkdir, writeFile } = require('fs/promises');
const path = require('path');

const directus = new Directus('https://cms.pstsauveur.ca');

async function start() {
  await mkdir(path.join(__dirname, '../temp'), { recursive: true })

  await directus.auth.static(process.env.DIRECTUS_TOKEN)

  await fetchAndSaveEvents(directus)
  await fetchAndSaveBaptismAvailabilities(directus)

  console.log('Done.')
}

async function fetchAndSaveEvents (directus) {
  console.log('Fetching evenements...')
  const { data } = await directus
    .items('evenements')
    .readByQuery({ 
      sort: ['date'], 
      filter: {
        status: {
          _eq: 'published'
        }
      } 
    });

  const events = data.map(event => {
    const [year, month] = event.date.split('T')[0].split('-')

    event.formattedDate = formatDateLong(event.date)
    event.link = `evenements/${year}/${month}/${event.id}`

    return event
  })

  await writeFile(path.join(__dirname, '../temp/evenements_a_venir.json'), 
    JSON.stringify(events.filter(ev => isInTheFuture(ev.date)).slice(0, 5), null, 2), 'utf8')

  for await (const event of events) {
    const [year, month] = event.date.split('T')[0].split('-')
    const dirname = path.join(__dirname, '..', 'temp/evenements', `${year}/${month}`)
    const filepath = path.join(dirname, `${event.id}`)

    await mkdir(dirname, { recursive: true })
    await writeFile(`${filepath}.html`, `
      @@include('_evenement.html', {
        title: "${event.titre}",
        category: "Évènements",
        date: "${event.formattedDate}",
        text: "@@include(markdown('../../temp/evenements/${year}/${month}/${event.id}.md'))"
      })`, 'utf8')
    await writeFile(`${filepath}.md`, event.contenu || '', 'utf8')
  }
}

async function fetchAndSaveBaptismAvailabilities(directus) {
  console.log('Fetching disponibilite_bapteme + disponibilite_catechese_bapteme...')

  const disponibilite_bapteme = await directus
    .items('disponibilite_bapteme')
    .readByQuery({ 
      sort: ['date'], 
      filter: {
        status: {
          _eq: 'published'
        },
        date: {
          _gte: '$NOW',
        },
      }
    }).then(res => res.data.map(d => {
      d.formattedDate = formatDateLong(d.date)
      return d
    }));

  const disponibilite_catechese_bapteme = await directus
    .items('disponibilite_catechese_bapteme')
    .readByQuery({ 
      sort: ['date'], 
      filter: {
        status: {
          _eq: 'published'
        },
        date: {
          _gte: '$NOW',
        },
      }
    }).then(res => res.data.map(d => {
      d.formattedDate = formatDateLong(d.date)
      return d
    }));


  await writeFile(path.join(__dirname, '../temp/disponibilites_bapteme.json'), 
    JSON.stringify(disponibilite_bapteme, null, 2), 'utf8')

  await writeFile(path.join(__dirname, '../temp/disponibilite_catechese_bapteme.json'), 
    JSON.stringify(disponibilite_catechese_bapteme, null, 2), 'utf8')
}

start()

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatDateLong (str) {
  return capitalize(new Intl.DateTimeFormat('fr-CA', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(new Date(str)))
}

function isInTheFuture (str) {
  return new Date(str) > new Date()
}
