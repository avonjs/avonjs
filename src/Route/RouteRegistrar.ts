import type { Router } from 'express';
import Dispatcher from './Dispatcher';

export default class {
  constructor(protected router: Router) {}

  public register(): void {
    this.resourceRoutes();
  }

  protected resourceRoutes(): void {
    // schema
    this.router.get('/schema', Dispatcher.dispatch('SchemaController'));

    // actions API
    this.router.get(
      '/resources/:resourceName/actions',
      Dispatcher.dispatch('ActionIndexController'),
    );
    // common actions
    this.router.post(
      '/resources/:resourceName/actions/:actionName',
      Dispatcher.dispatch('ActionStoreController'),
    );
    this.router.post(
      '/resources/:resourceName/:resourceId/actions/:actionName',
      Dispatcher.dispatch('ActionStoreController'),
    );
    // destructive actions
    this.router.delete(
      '/resources/:resourceName/actions/:actionName',
      Dispatcher.dispatch('ActionStoreController'),
    );
    this.router.delete(
      '/resources/:resourceName/:resourceId/actions/:actionName',
      Dispatcher.dispatch('ActionStoreController'),
    );
    // Associable Resources...
    this.router.get(
      '/resources/:resourceName/associable/:field',
      Dispatcher.dispatch('AssociableController'),
    );
    // resources API
    this.router.get(
      '/resources/:resourceName',
      Dispatcher.dispatch('ResourceIndexController'),
    );
    this.router.post(
      '/resources/:resourceName',
      Dispatcher.dispatch('ResourceStoreController'),
    );
    this.router.get(
      '/resources/:resourceName/:resourceId',
      Dispatcher.dispatch('ResourceDetailController'),
    );
    this.router.get(
      '/resources/:resourceName/:resourceId/using/:field',
      Dispatcher.dispatch('ResourceLookupByFieldController'),
    );
    this.router.put(
      '/resources/:resourceName/:resourceId',
      Dispatcher.dispatch('ResourceUpdateController'),
    );
    this.router.delete(
      '/resources/:resourceName/:resourceId',
      Dispatcher.dispatch('ResourceDeleteController'),
    );
    this.router.delete(
      '/resources/:resourceName/:resourceId/force',
      Dispatcher.dispatch('ResourceForceDeleteController'),
    );
    this.router.put(
      '/resources/:resourceName/:resourceId/restore',
      Dispatcher.dispatch('ResourceRestoreController'),
    );
    this.router.get(
      '/resources/:resourceName/:resourceId/review',
      Dispatcher.dispatch('ResourceReviewController'),
    );
  }
}
