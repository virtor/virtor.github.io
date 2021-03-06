'use strict';
angular.module('descubre.services', ['filtros'])

.factory('Query', ['$http', '$q', function($http, $q) {
        var SPARQL_ENDPOINT = 'http://datos.zaragoza.es/sparql';
        var API_ENDPOINT = 'http://www.zaragoza.es/api';
        var SOLR_ENDPOINT = 'http://www.zaragoza.es/buscador/select?';
        return {
            list: function(query, graph) {
                var params = {};
                var deferred = $q.defer();
                if (angular.isUndefined(graph)) {
                    graph = '';
                }
                console.log(graph);
                console.log(query);
                $http.get(SPARQL_ENDPOINT + '?default-graph-uri=' + encodeURIComponent(graph) + '&query=' + encodeURIComponent(query) + '&format=application%2Fsparql-results%2Bjson&timeout=0').
                success(function(data, status, headers, config) {
                    deferred.resolve(data);
                }).
                error(function(data, status, headers, config) {
                    deferred.reject(data);
                });
                return deferred.promise;
            },
            describe: function(uri, graph) {
                var params = {};
                var deferred = $q.defer();
                if (angular.isUndefined(graph)) {
                    graph = '';
                }
                $http.get(SPARQL_ENDPOINT + '?default-graph-uri=' + encodeURIComponent(graph) + '&query=describe+' + encodeURIComponent('<' + uri + '>') + '&format=' + encodeURIComponent('application/x-json+ld') + '&timeout=0').
                success(function(data, status, headers, config) {
                    deferred.resolve(data["@graph"][0]);
                }).
                error(function(data, status, headers, config) {
                    deferred.reject(data);
                });
                return deferred.promise;
            },
            getSolr: function(query, category, facet, fq, start, rows) {
                var params = {};
                var deferred = $q.defer();
                $http({
                    method: 'JSONP',
                    url: SOLR_ENDPOINT,
                    params: {
                        'json.wrf': 'JSON_CALLBACK',
                        'wt': 'json',
                        'start': start || 0,
                        'rows': rows || 100,
                        'facet': 'true',
                        'facet.field': facet,
                        'facet.mincount': 1,
                        'fl': 'uri,title,id,texto_t,x_coordinate,y_coordinate,last_modified,temas_smultiple',
                        'q': query + ' AND -tipocontenido_s:estatico AND category:' + category,
                        'fq': fq
                    }
                }).success(function(data, status, headers, config) {
                    deferred.resolve(data);
                }).error(function(data, status, headers, config) {
                    deferred.reject(data);
                });
                return deferred.promise;
            },
            getApi: function(uri) {
                var params = {};
                var deferred = $q.defer();
                console.log(API_ENDPOINT + uri);
                $http.get(API_ENDPOINT + uri).
                success(function(data, status, headers, config) {
                    deferred.resolve(data);
                }).
                error(function(data, status, headers, config) {
                    deferred.reject(data);
                });
                return deferred.promise;
            }
        };
    }])
    // .factory('Agenda', ['$http', '$q', function($http, $q) {
    .factory('Agenda', ['$filter', function($filter) {

        function add(registro) {
            var dato = {};
            if (registro.uri) {
                dato.uri = registro.uri.value || registro.uri;
            } else {
                dato.uri = 'punto-' + registro.id + '-mapa-colab';
            }

            dato.title = registro.title.value || registro.title;
            dato.date = $filter('date')($filter('getDate')(registro),'yyyy-MM-dd');
            dato.startTime = $filter('date')($filter('getStartTime')(registro),'HH:mm');
            dato.endTime = $filter('date')($filter('getEndTime')(registro),'HH:mm');
            dato.latitud = $filter('getLatitud')(registro);
            dato.longitud = $filter('getLongitud')(registro);

            var items = JSON.parse(localStorage.getItem('items')) || {};
            if (!items.dated) {
                items.dated = {};
            }
            if (!items.nodated) {
                items.nodated = [];
            }
            if (dato.date) {

                if (!items.dated[dato.date]) {
                    items.dated[dato.date] = [];
                }
                items.dated[dato.date].push(dato);

                items.dated[dato.date] = items.dated[dato.date].sort(function(a, b) {
                    return new Date(a.startTime) - new Date(b.startTime);
                });

            } else {
                items.nodated.push(dato);
            }
            localStorage.setItem('items', JSON.stringify(items));

        }

        function remove(index, fecha, tipo) {
            var items = JSON.parse(localStorage.getItem('items')) || {};
            var dato;
            if (tipo == 'dated') {
                items.dated[fecha].splice(index, 1);
                if (items.dated[fecha].length === 0) {
                    delete items.dated[fecha];
                }
            } else {
                items.nodated.splice(index, 1);
            }
            localStorage.setItem('items', JSON.stringify(items));
        }

        function update(index, fecha, tipo, registro) {
            remove(index, fecha, tipo);
            add(registro);
        }
        return {
            add: add,
            remove: remove,
            update: update,
            get: function(index, fecha, tipo) {
                var items = JSON.parse(localStorage.getItem('items')) || {};
                var dato;
                if (tipo == 'dated') {
                    return items.dated[fecha][index];
                } else {
                    return items.nodated[index];
                }
            },
            existe: function(registro){
                var uri = '';
                if (registro.uri) {
                    uri = registro.uri.value || registro.uri;
                } else {
                    uri = 'punto-' + registro.id + '-mapa-colab';
                }
                var items = localStorage.getItem('items') || '';
                return items.indexOf(uri) >= 0;
            },
            list: function() {
                return JSON.parse(localStorage.getItem('items')) || [];
            }
        };
    }]);
