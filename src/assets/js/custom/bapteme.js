const CAPTCHA_ID = '6LcA5lElAAAAAPY5DzY8XB48DTnPn5R1q1zEpjmL';

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
    'btn_submit'
  ])

  state.datesCatechese = [...els['date_catechese'].options]
    .map(o => ({ value: o.value, label: o.label }))

  // Mise à jour des dates de catéchese
  els['date_bapteme'].addEventListener('change', updateDropdownDatesCatechese)
  els['form_bapteme_1'].addEventListener('submit', onSubmit)

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
      console.log(dateCatechese)
      catecheseEl.add(new Option(item.label, item.value));
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
  const has = (
    els['date_bapteme'].checkValidity() && 
    els['date_catechese'].checkValidity()
  )
  console.log('has selected dates', has)
  return has
}

function emailIsValid () {
  return els['input_courriel'].checkValidity();
}

function validateYear (str) {
  const isValid = /^(19|20)\d{2}$/.test(str);
  console.log('year', str, isValid);
  return isValid;
}

function onSubmit (e) {
  e.preventDefault();

  grecaptcha.ready(function() {
    grecaptcha.execute(CAPTCHA_ID, { action: 'submit' }).then(callApi);
  });
}

async function callApi(token) {
  // TODO: add a spinner on the button

  console.log(els['doc_enfant'].files)

  const config = {
    url: 'http://localhost:9000/2015-03-31/functions/function/invocations',
    body: {
      token: token,
      courriel: '',
      date_bapteme: els['date_bapteme'].value,
      date_catechese: els['date_catechese'].value,
      enfant: {
        doc: await loadFile(els['doc_enfant'].files)
      },
      parrain: {
        doc: await loadFile(els['doc_parrain'].files),
        annee: els['input_parrain_annee'].value || null
      },
      marraine: {
        doc: await loadFile(els['doc_marraine'].files),
        annee: els['input_marraine_annee'].value || null
      }
    }
  }

  console.log(config)

  // fetch(config).then(res => {
  //   console.log('done!')
  // })
}

async function loadFile (f) {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = (e) => {
      // const b64String = btoa(String.fromCharCode(...new Uint8Array(e.target.result)));
      resolve(e.target.result)
    };

    reader.onerror = (e) => {
      reject(e.message)
    }

    reader.readAsArrayBuffer(f);
  })
}