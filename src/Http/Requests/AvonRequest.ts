import Avon from '../../Avon';
import {
  type Attributes,
  type Model,
  RequestTypes,
  TrashedStatus,
} from '../../Contracts';
import ModelNotFoundException from '../../Exceptions/ModelNotFoundException';
import ResourceNotFoundException from '../../Exceptions/ResourceNotFoundException';
import type { Repository } from '../../Repositories';
import type Resource from '../../Resource';
import FormRequest from './FormRequest';

export default abstract class AvonRequest extends FormRequest {
  /**
   * Indicates type of the request instance.
   */
  abstract type(): RequestTypes;

  /**
   * Determine if this request is a create or attach request.
   */
  public isCreateOrAttachRequest(): boolean {
    return (
      this.type() === RequestTypes.ResourceCreateOrAttachRequest ||
      (this.query('editing') === 'true' &&
        ['create', 'attach'].includes(this.query('editMode')))
    );
  }

  /**
   * Determine if this request is an update or update-attached request.
   */
  public isUpdateOrUpdateAttachedRequest(): boolean {
    return (
      this.type() === RequestTypes.ResourceUpdateOrUpdateAttachedRequest ||
      (this.query('editing') === 'true' &&
        ['update', 'update-attached'].includes(this.query('editMode')))
    );
  }

  /**
   * Determine if this request is a resource index request.
   */
  public isResourceIndexRequest(): boolean {
    return this.type() === RequestTypes.ResourceIndexRequest;
  }

  /**
   * Determine if this request is a resource detail request.
   *
   * @return bool
   */
  public isResourceDetailRequest(): boolean {
    return this.type() === RequestTypes.ResourceDetailRequest;
  }

  /**
   * Determine if this request is a resource review request.
   *
   * @return bool
   */
  public isResourceReviewRequest(): boolean {
    return this.type() === RequestTypes.ResourceReviewRequest;
  }

  /**
   * Determine if this request is a resource association request.
   *
   * @return bool
   */
  public isResourceAssociationRequest(): boolean {
    return this.type() === RequestTypes.AssociableRequest;
  }

  /**
   * Determine if this request is an action request.
   */
  public isActionRequest(): boolean {
    return this.type() === RequestTypes.ActionRequest;
  }

  /**
   * Determine if this request is an schema request.
   */
  public isSchemaRequest(): boolean {
    return this.type() === RequestTypes.SchemaRequest;
  }

  /**
   * Determine if this request is either create, attach, update, update-attached or action request.
   */
  public isFormRequest(): boolean {
    return (
      this.isCreateOrAttachRequest() ||
      this.isUpdateOrUpdateAttachedRequest() ||
      this.isActionRequest()
    );
  }

  /**
   * Determine if this request is an index or detail request.
   */
  public isPresentationRequest(): boolean {
    return this.isResourceIndexRequest() || this.isResourceDetailRequest();
  }

  /**
   * Determine if the requested resource is soft deleting.
   */
  public resourceSoftDeletes(): boolean {
    return this.resource().softDeletes();
  }

  /**
   * Get the resource instance for the request or abort.
   */
  public resource(): Resource {
    const resource = Avon.resourceForKey(this.route('resourceName'));

    ResourceNotFoundException.unless(resource);

    return resource;
  }

  /**
   * Get the repository for resource being requested.
   */
  public repository(): Repository<Model> {
    return this.resource().resolveRepository(this);
  }

  /**
   * Get the model for resource being requested.
   */
  public model(): Model {
    return this.repository().model();
  }

  /**
   * Make a new model for given attributes.
   */
  public newModel(attributes: Attributes): Model {
    const Constructor = this.model().constructor.prototype.constructor;

    return new Constructor(attributes);
  }

  /**
   * Create new instance of the resource being requested for given item.
   */
  public newResource(resource?: Model): Resource {
    const Constructor = this.resource().constructor.prototype.constructor;

    return new Constructor(resource);
  }

  /**
   * Find the resource instance for the request or abort.
   */
  public async findResourceOrFail(resourceId?: number): Promise<Resource> {
    return this.newResource(await this.findModelOrFail(resourceId));
  }

  /**
   * Find the resource instance for the request.
   */
  public async findResource(
    resourceId?: number,
  ): Promise<Resource | undefined> {
    return this.newResource(await this.findModel(resourceId));
  }

  /**
   * Find the model instance for the request or throw an exception.
   */
  public async findModelOrFail(resourceId?: number) {
    const item = await this.findModel(resourceId);

    ModelNotFoundException.unless(item);

    return item;
  }

  /**
   * Find the model instance for the request.
   */
  public async findModel(resourceId?: number): Promise<Model | undefined> {
    return this.findModelQuery(resourceId).first();
  }

  /**
   * Find the model instance for the request.
   */
  public findModelQuery(resourceId?: number) {
    return this.repository().whereKey(
      resourceId ?? this.route('resourceId') ?? this.query('resourceId'),
    );
  }

  /**
   * Get trashed status.
   */
  protected trashed(): TrashedStatus {
    return this.query('trashed') ?? TrashedStatus.DEFAULT;
  }

  /**
   * Get authenticated user.
   */
  public user() {
    return this.getRequest().auth;
  }
}
