# ngcomponent

Your AngularJS components made easily.

## Usage
```
bower install --save ngcomponent
```

## Examples
```js
angular.module('app', ['component'])

.controller('ModalController', ['$scope', 'userData', function ($scope, userData) {
	$scope.settings = userData.settings;
}])

.controller('AppController', function (projectModal, $scope) {
	var modals = {
		addProduct: projectModal({
			templateUrl: 'templates/cached/add-product-modal.html',
			scope: $scope
		}),
		settings: projectModal({
			templateUrl: 'templates/cached/settings-modal.html',
			controller: 'ModalController',
			// controller: 'ModalController as modalCtrl'
			// controllerAs: 'modalCtrl'
		})
	};

	modals.editProduct = modals.addProduct;

	this.modalAddProduct = function (company) {
		modals.addProduct.locals({
			company: company,
			product: {}
		});

		modals.addProduct.show();
	};

	this.modalEditProduct = function (company, product) {
		modals.addProduct.locals({
			company: company,
			product: product
		});

		modals.editProduct.show();
	};
})

.factory('projectModal', function ($component) {
	return function (options) {
		return $component({
			templateUrl: options.templateUrl
			scope: options.scope
		});
	};
})
```

We don't aim to support async requests while creating component, only `$templateCache` templates. So, create your own wrapper, if you do not use `[gulp-ng-templates](https://npmjs.org/package/gulp-ng-templates)`:

```js
.factory('$myModal', function ($component, $http, $templateCache) {
	function create (options) {
		var component = $component(options);

		// deal with it your way

		return component;
	}

	return {
		fromTemplateUrl: function (templateUrl, options) {
			return $http.get(templateUrl).then(function (response) {
				options.template = $templateCache.put(templateUrl, response.data);

				return create(options);
			});
		}
	};
})
.controller('SomeController', function ($myModal, $scope) {
	$myModal({
		templateUrl: 'a/b/c/e.html'
	}).then(function (modal) {
		$scope.modal = modal;
	});
})
```