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
			.map(function (p) {return {sigla: p.sigla_provincia, istat: p.istat_provincia, nome: (p.nome_provincia && p.nome_provincia != '-') ? p.nome_provincia : p.nome_cm }})
			.sortBy('sigla')
			.value();
		
		var normRegioni = _.chain(regioni)
			.map(function (p) {return {istat: p.istat_regione, nome: p.nome_regione }})
			.sortBy('istat')
			.value();
		
		if (argv.set == 'regioni') {
			result = normRegioni;
		} else if (argv.set == 'province') {
			result = normProvince;
		} else {
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
	out += argv.set;
	out += ' VALUES (';
	out += _.values(wrapped).join(',');
	out += ');';
	return out;
}