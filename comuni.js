var csv = require('csv');
var fs = require('fs');
var request = require('request');
var iconv = require('iconv-lite');
var argv = require('optimist').argv;
var _ = require('underscore');

var permalink = 'http://www.istat.it/storage/codici-unita-amministrative/elenco-comuni-italiani.csv';

if (argv.cache) {
	fs.readFile('./comuni.csv', function read(err, data) {
		if (err) {
			fromPermalink(true);
		} else {
			parseCsv(data);
		}
	});
} else {
	fromPermalink();
}

function fromPermalink(cache) {
	request.get({
			uri: permalink,
			encoding: 'binary'
		},
		function (error, response, body) {
			if (cache) {
				fs.writeFile('./comuni.csv', body);
			}
			parseCsv(body);
		}
	);
}

// Codice Regione
// Codice Città Metropolitana
// Codice Provincia (1)
// Progressivo del Comune (2)
// Codice Comune formato alfanumerico
// Denominazione in italiano
// Denominazione in tedesco
// Codice Ripartizione Geografica
// Ripartizione geografica
// Denominazione regione
// Denominazione Città metropolitana
// Denominazione provincia
// Flag Comune capoluogo di provincia
// Sigla automobilistica
// Codice Comune formato numerico
// Codice Comune numerico con 107 province (dal 2006 al 2009)
// Codice Comune numerico con 103 province (dal 1995 al 2005)
// Codice Catastale del comune
// Popolazione legale 2011 (09/10/2011)
// Codice NUTS1 2010
// Codice NUTS2 2010 (3) 
// Codice NUTS3 2010
// Codice NUTS1 2006
// Codice NUTS2 2006 (3)
// Codice NUTS3 2006

function parseCsv(body) {
	var utf8String = iconv.decode(new Buffer(body), "utf-8");
	csv.parse(
		utf8String,
		{
		delimiter: ';',
		trim: true,
		skip_empty_lines: true,
		columns: [
			'istat_regione', 'cod_cm', 'istat_provincia',
			'prog_comune', 'istat_comune', 'nome',
			'nome_de', 'cod_ripartizione', 'ripartizione',
			'nome_regione', 'nome_cm', 'nome_provincia',
			'capoluogo', 'sigla_provincia',
			'istat_comune_numerico', 'istat_comune_numerico_107',
			'istat_comune_numerico_103', 'cod_catastale',
			'popolazione',
			'nuts1_2010', 'nuts2_2010', 'nuts3_2010',
			'nuts1_2006', 'nuts2_2006', 'nuts3_2006'
		]
	}, function (err, data) {
		data.shift();
		data = _.filter(data, function (e) { 
			return e.nome;
		});
		var province = _.indexBy(data, 'istat_provincia');
		var regioni = _.indexBy(data, 'istat_regione');

		var normProvince = _.chain(province)
			.map(function (p) {
				return {
					sigla: p.sigla_provincia,
					 istat: p.istat_provincia,
					 nome: (p.nome_provincia && p.nome_provincia != '-') ? p.nome_provincia : p.nome_cm 
				}
			})
			.sortBy('sigla')
			.value();
		
		var normRegioni = _.chain(regioni)
			.map(function (p) {
				return {
					istat: p.istat_regione,
					nome: p.nome_regione
				}
			})
			.sortBy('istat')
			.value();
		
		if (argv.set == 'regioni') {
			result = normRegioni;
		} else if (argv.set == 'province') {
			result = normProvince;
		} else {
			argv.set = 'comuni';
			result = data;
		}

		if (argv.sort) {
			result = _.sortBy(result, argv.sort);
		}
 
		if (argv.id) {
			var i = 1;
			result = _.map(result, function(row) {
				row.id = i++;
				return row;
			});
		}

		if (argv.cols) {
			result = _.map(result, function(row) {
				return _.pick(row, argv.cols.split(','));
			});
		}

		if (argv.sql) {
			result = _.map(result, sqlize).join('\n');
		}

		console.log(result);
	});
}

function sqlize(row) {
	var wrapped = _.mapObject(row, function (e) {
		e += '';
		return '\'' + e.replace(/'/g, '\\\'') + '\'';
	})
	var out = 'INSERT INTO ';
	out += argv.table || argv.set;
	out += ' VALUES (';
	out += _.values(wrapped).join(',');
	out += ');';
	return out;
}