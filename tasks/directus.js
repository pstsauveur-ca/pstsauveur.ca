var { Directus } = require('@directus/sdk');
const { mkdir, writeFile } = require('fs/promises');
const path = require('path');

const directus = new Directus('https://cms.pstsauveur.ca');

async function start() {
  await directus.auth.static(process.env.DIRECTUS_TOKEN)

  const { data } = await directus.items('evenements').readByQuery({ sort: ['date'] });

  for await (const event of data) {
    const [year, month, day] = event.date.split('T')[0].split('-')
    const dirname = path.join(__dirname, '..', 'temp/evenements', `${year}/${month}`)
    const filepath = path.join(dirname, `${event.id}`)
    const date = capitalize(new Intl.DateTimeFormat('fr-CA', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(new Date(event.date)))

    await mkdir(dirname, { recursive: true })
    await writeFile(`${filepath}.html`, `
@@include('_evenement.html', {
  title: "${event.titre}",
  category: "Évènements",
  date: "${date}",
  text: "@@include(markdown('../../temp/evenements/${year}/${month}/${event.id}.md'))"
})`, 'utf8')
    await writeFile(`${filepath}.md`, event.contenu, 'utf8')
  }
}

start()

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}