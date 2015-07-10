function ComponentProvider () {
	var defaults = this.defaults = {
		hiddenClass: 'hidden',
		visibleClass: 'visible'
	};

	this.$get = function ComponentFactory ($$helpers, $animate) {
		var Component = $$helpers.createClass({
			initialize: function (componentEl, id, options) {
				this.isVisible = false;

				if(isObject(id)) {
					options = id;
					id = undefined;
					extend(this, options);
				}

				if(isDefined(componentEl)) {
					this.setElement(componentEl);
				}

				if(isDefined(id)) {
					this.setId(id);
				}

				if(!this.getId()) {
					var el = this.getElement();
					var tagName = el && el[0] && el[0].tagName || '';
					this.id = tagName + '_' + $$helpers.nextId();
					this._idRedefinition = true;
				}

				this.on('visibleStateChangeSuccess', function () {
					var element = this.getElement();
					if(this.getVisibleState()) {
						element.attr('id', this.getId());
					} else {
						element.attr('id', '');
					}
				});
				this.on('visibleStateChangeSuccess', function () {
					if(this.getVisibleState()) {
						this.emit('visible');
					} else {
						this.emit('notVisible');
					}
				});

				this.on('visibleStateChangeStart', function (visibleState) {
					if(visibleState) {
						this.emit('visibleChangeStart');
					} else {
						this.emit('notVisibleChangeStart');
					}
				});
			},

			show: function () {
				return this.setVisibleState(true);
			},

			hide: function () {
				return this.setVisibleState(false);
			},

			toggle: function () {
				return this.setVisibleState(!this.getVisibleState());
			},

			getHiddenClass: function () {
				return defaults.hiddenClass;
			},

			getVisibleClass: function () {
				return defaults.visibleClass;
			},

			getVisibleState: function () {
				return !!this.isVisible;
			},

			setVisibleState: function (visibleState) {
				var self = this,
						el = this.getElement(),
						promises = [],
						addClass, // Class to add before animate
						removeClass, // Class to remove before animate
						hiddenClass = this.getHiddenClass(),
						visibleClass = this.getVisibleClass(),
						hiddenClassMethod = visibleState ? 'removeClass' : 'addClass';

				this.emit('visibleStateChangeStart', visibleState);

				addClass = visibleState ? visibleClass : hiddenClass;
				removeClass = visibleState ? hiddenClass : visibleClass;

				return $animate.setClass(el, addClass, removeClass).then(function () {
					self.isVisible = visibleState;
					self.emit('visibleStateChangeSuccess');
				}, function (err) {
					self.emit('visibleStateChangeError', err);
				});
			},

			setId: function (id) {
				if(isDefined(this.getId()) && !this._idRedefinition) {
					throw new Error('You cannot change a component.id more than once');
				}

				Object.defineProperty(this, 'id', {
					value: id,
					writable: false
				});

				this._idRedefinition = false;

				return this;
			},

			getId: function () {
				return this.id;
			},

			setElement: function (componentEl) {
				var el = this.componentEl = componentEl,
						isVisible = this.getVisibleState(),
						hiddenClass = this.getHiddenClass();

				if(!el.hasClass(hiddenClass) && !isVisible) {
					el.addClass(hiddenClass);
				}

				return this;
			},

			getElement: function () {
				return this.componentEl;
			},

			enterElement: function (parent, after) {
				var self = this;

				if(isUndefined(parent)) {
					parent = angular.element(document.body);
				}

				this.emit('enterElementStart');

				return $animate.enter(this.getElement(), parent, after).then(function () {
					self.emit('enterElementSuccess');
				});
			},

			removeElement: function () {
				this.getElement().remove();
				this.componentEl = undefined;
				return this;
			},

			leaveElement: function () {
				var self = this;

				this.emit('leaveElementStart');

				return $animate.leave(this.getElement()).then(function () {
					self.emit('leaveElementSuccess');
				});
			},

			destroy: function () {
				var self = this;

				return this.leaveElement().then(function () {
					self.removeElement();
				});
			}
		});

		return Component;
	};
}

function $ComponentProvider () {
	var defaults = this.defaults = {};

	this.$get = function ($controller, $compile, $templateCache, $animate, $rootScope, Component, $$helpers) {
		var bodyEl = angular.element(document.body);

		return function (options) {
			var $component = {},
					el,
					template;

			if(isString(options)) {
				template = options;
				options = {};
				options.template = template;
			}

			$component.options = options = extend({}, defaults, options);

			if(!isScope(options.scope)) {
				options.scope = $rootScope.$new();
			}

			var scope = options.scope = $component.scope = options.scope.$new(),
					apply = $$helpers.digest(scope);

			var component = options.component = $component.component = new Component();
			var controller;

			if(options.controller) {
				controller = $controller(options.controller, {
					$scope: scope
				});
			}

			if(options.controllerAs) {
				scope[options.controllerAs] = controller;
			}

			scope.$on('$destroy', function () {
				component.destroy();
			});

			forEach(['show', 'hide', 'toggle'], function (key) {
				$component[key] = scope['$' + key] = function () {
					return apply(function () {
						return component[key]();
					});
				};
			});

			$component.getElement = function () {
				return component.getElement();
			};

			// Extend scope with new locals
			function locals (obj) {
				apply(function() {
					extend(scope, obj);
				});
			}
			$component.locals = locals;

			function destroy () {
				component.leaveElement();
			}
			$component.destroy = destroy;

			// Create the element
			// using provided
			// template/templateUrl
			if(isUndefined(options.template) && Defined(options.templateUrl)) {
				template = options.template = $templateCache.get(options.templateUrl);
			}

			if(isObject(options.locals)) {
				locals(options.locals);
			}

			if(isUndefined(options.template)) {
				throw new Error('template must have something');
			}

			el = options.el = $component.element = angular.element(options.template);

			var componentLink = $component.componentLink = $compile(el);

			// Compile the component
			// for the first time
			// before it gets showed
			// up
			component.once('visibleChangeStart', function () {
				componentLink(scope);
			});

			$animate.enter(el, bodyEl).then(function () {
				component.emit('enter');
			});

			component.setElement(el);

			return $component;
		};
	}
}

angular.module('component', [])
.provider('Component', ComponentProvider)
.provider('$component', $ComponentProvider);