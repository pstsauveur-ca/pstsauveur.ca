import { writeFile } from 'fs/promises';
import path from 'path';

const STRAPI_URL = 'https://cms.pstsauveur.ca';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

interface ICMSContent {
  annonces: {
    id: number,
    attributes: {
      Texte: string,
      Date: string,
      Titre: string,
      createdAt: string,
      updatedAt: string,
      publishedAt: string
    }
  }[]
}

(async function main() {
  const outputPath = path.join(__dirname, '../dist', 'content.json');
  const content: ICMSContent = {
    annonces: await fetchResources('annonces'),
  };

  await writeFile(outputPath, JSON.stringify(content, null, 2), 'utf8');
}());

async function fetchResources(type: string) {
  const { data } = await fetch(`${STRAPI_URL}/api/${type}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    },
  }).then((response) => response.json());

  return data;
}

export {};
