# comuni-italiani
Tool scritto in NodeJS per ricavare una lista aggiornata di comuni, province e regioni italiane

## Overview

In molti progetti è necessario includere dei dati aggiornati riguardanti i comuni presenti sul territorio italiano; questa necessità spesso si traduce in una caccia a script o elenchi online spesso non aggiornati. Con questo script tali dati possono essere ricavati direttamente dal sito dell'ISTAT con la garanzia che siano completi e sempre aggiornati al dato ufficiale.

## Installazione

Per poter utilizzare lo script è necessario installare NodeJs.

## Utilizzo e command line options

`node comuni.js`

per ottenere l'elenco ISTAT in formato JSON dei comuni

`node comunu.js --set=regioni`

per ottenere l'elenco ISTAT in formato JSON delle regioni

`node comunu.js --set=province`

per ottenere l'elenco ISTAT in formato JSON delle province

`node comunu.js --id`

per aggiungere un campo `id` autoincrementante ai dati

`node comunu.js --cache`

evita che ad ogni utilizzo del tool venga prelevato l'elenco ISTAT via HTTP, memorizzandolo sul filesystem locale

`node comunu.js --sort=nome`

ordina i risultati per il campo indicato nel parametro `--sort`. Gli id autoincrementanti vengono applicati successivamente all'ordinamento.

`node comunu.js --cols=id,nome`

filtra le colonne restituendo quelle indicate

`node comunu.js --sql`

ottiene l'output sotto forma di `INSERT` per SQL.