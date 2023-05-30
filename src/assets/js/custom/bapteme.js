// const CAPTCHA_ID = '6LcA5lElAAAAAPY5DzY8XB48DTnPn5R1q1zEpjmL'; //prod
const CAPTCHA_ID = '6LdHkawlAAAAAP569ASlKi_UJ_aBC8aSCW_af1lN'; // dev
const API_URL = 'http://localhost:9000/2015-03-31/functions/function/invocations';
const NODE_ENV = 'dev'

const els = {};
const state = {
  datesCatechese: []
};

document.addEventListener('DOMContentLoaded', () => {
  loadElements([
    // formulaire
    'form_bapteme_1',
    // certificat de bapteme
    'doc_enfant',
    // parrain/marraine
    'opt_parrain_marraine',
    'opt_marraine_seulement',
    'opt_parrain_seulement',
    // marraine
    'opt_marraine_ici',
    'opt_marraine_ailleurs',
    'input_marraine_annee',
    'doc_marraine',
    // parrain
    'opt_parrain_ici',
    'opt_parrain_ailleurs',
    'input_parrain_annee',
    'doc_parrain',
    // dates
    'date_bapteme',
    'date_catechese',
    // bouton d'envoi
    'input_courriel',
    'btn_submit',
    // messages
    'output-box',
    'output-text'
  ])

  state.datesCatechese = [...els['date_catechese'].options]
    .map(o => ({ 
      value: o.value, 
      label: o.label,
      dateId: o.dataset.dateId
    }))

  // Mise à jour des dates de catéchese
  els['date_bapteme'].addEventListener('change', updateDropdownDatesCatechese)
  els['btn_submit'].addEventListener('click', onSubmit)

  // Validation à chaque changement
  Object.values(els)
    .filter(el => [HTMLInputElement, HTMLSelectElement].some(t => el instanceof t))
    .forEach(el => el.addEventListener('change', validateForm))

  updateDropdownDatesCatechese()
});

function loadElements (arr) {
  arr.forEach(str => {
    els[str] = document.getElementById(str)
  })
}

function updateDropdownDatesCatechese() {
  const dateBapteme = new Date(els['date_bapteme'].value);
  const catecheseEl = els['date_catechese'];

  [...catecheseEl.options].forEach(() => {
    catecheseEl.remove(0);
  });

  state.datesCatechese.forEach((item) => {
    const dateCatechese = new Date(item.value);
    if (dateCatechese < dateBapteme) {
      const optionEl = new Option(item.label, item.value);
      optionEl.dataset.dateId = item.dateId;
      catecheseEl.add(optionEl);
    }
  });

  validateForm();
}

function validateForm () {
  console.log('Change detected. Validating form...');
  const formIsValid = (
    certIsValid() &&
    (hasMarraine() ? marraineIsValid() : true) && 
    (hasParrain() ? parrainIsValid() : true) &&
    hasSelectedDates() &&
    emailIsValid()
  )

  console.log('Form is valid:', formIsValid)

  els['btn_submit'].disabled = !formIsValid;
  // els['btn_submit'].disabled = false;
}

function certIsValid() {
  return els['doc_enfant'].checkValidity();
}

function hasMarraine() {
  return els['opt_parrain_marraine'].checked || els['opt_marraine_seulement'].checked;
}

function hasParrain() {
  return els['opt_parrain_marraine'].checked || els['opt_parrain_seulement'].checked;
}

function marraineIsValid() {
  return ( 
    (els['opt_marraine_ailleurs'].checked && els['doc_marraine'].checkValidity()) || 
    (els['opt_marraine_ici'].checked && validateYear(els['input_marraine_annee'].value))
  );
}

function parrainIsValid() {
  return ( 
    (els['opt_parrain_ailleurs'].checked && els['doc_parrain'].checkValidity()) || 
    (els['opt_parrain_ici'].checked && validateYear(els['input_parrain_annee'].value))
  );
}

function hasSelectedDates () {
  return (
    els['date_bapteme'].checkValidity() && 
    els['date_catechese'].checkValidity()
  )
}

function emailIsValid () {
  return els['input_courriel'].checkValidity();
}

function validateYear (str) {
  const isValid = /^(19|20)\d{2}$/.test(str);
  return isValid;
}

function onSubmit (e) {
  e.preventDefault();

  els['btn_submit'].disabled = true;
  els['btn_submit'].classList.add('loading');

  grecaptcha.ready(() => 
    grecaptcha.execute(CAPTCHA_ID, { action: 'submit' }).then(callApi)
  );
}

function stopLoading () {
  els['btn_submit'].disabled = false;
  els['btn_submit'].classList.remove('loading');
}

async function callApi(token) {
  const docEnfant = els['doc_enfant'].files[0]
  const docParrain = els['doc_parrain'].files[0]
  const docMarraine = els['doc_marraine'].files[0]

  const body = {
    command: 'create_inscription_bapteme',
    args: {
      token: token,
      courriel: els['input_courriel'].value,
      format_enfant: getFileType(docEnfant),
      date_bapteme: els['date_bapteme'].selectedOptions[0].dataset.dateId,
      date_catechese: els['date_catechese'].selectedOptions[0].dataset.dateId,
      parrain_annee: els['input_parrain_annee'].value,
      marraine_annee: els['input_marraine_annee'].value,
      format_parrain: docParrain ? getFileType(docParrain) : undefined,
      format_marraine: docMarraine ? getFileType(docParrain) : undefined,
    }
  };

  const config = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  }

  console.log(API_URL, body);

  output('Création de l\'inscription...')

  let data
  try {
    data = await fetch(API_URL, config).then(res => res.json())
  } catch (err) {
    console.error(err)
    output('Erreur lors de la création de l\'inscription.')
    stopLoading()
    return 
  }
  
  output('Envoi du certificat de naissance...')
  
  try {
    await uploadFile(data.upload_urls.enfant, docEnfant);

  } catch (err) {
    console.error(err)
    output('Erreur lors de l\'envoi du certificat de naissance.')
    stopLoading()
    return 
  }

  if (data.upload_urls.marraine) {
    try {
      output('Envoi du certificat de confirmation de la marraine...')
      await uploadFile(data.upload_urls.marraine, docMarraine);
    } catch (err) {
      console.error(err)
      output('Erreur lors de l\'envoi du certificat de confirmation de la marraine.')
      stopLoading()
      return 
    }
  }

  if (data.upload_urls.parrain) {
    try {
      output('Envoi du certificat de confirmation du parrain...')
      await uploadFile(data.upload_urls.parrain, docParrain);
    } catch (err) {
      console.error(err)
      output('Erreur lors de l\'envoi du certificat de confirmation du parrain.')
      stopLoading()
      return 
    }
  }

  console.log('Done!')
  output('Succès!')
}

function output (text) {
  els['output-box'].classList.remove('hidden');
  els['output-text'].innerText = text;
}

function getFileType(file) {
  return file ? file.type.split('/')[1] : null
}

function uploadFile (url, file) {
  const formData = new FormData();
  formData.append(url, file);

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    body: formData
  });
}
