import {
  AbstractMixable,
  ResourceEvaluatorCallback,
  EvaluatorCallback,
  Model,
} from '../contracts';
import {
  approveCallback,
  reverseEvaluatorCallback,
  makeEvaluatorCallback,
} from '../helpers';
import AvonRequest from '../Http/Requests/AvonRequest';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class Presentable extends Parent {
    /**
     * Callback that indicates if the attribute should be shown on the index api.
     */
    public showOnIndexCallback: ResourceEvaluatorCallback = approveCallback();

    /**
     * Callback that indicates if the attribute should be shown on the detail api.
     */
    public showOnDetailCallback: ResourceEvaluatorCallback = approveCallback();

    /**
     * Callback that indicates if the attribute should be shown on the review api.
     */
    public showOnReviewCallback: ResourceEvaluatorCallback = approveCallback();

    /**
     * Callback that indicates if the attribute should be shown on the creation api.
     */
    public showOnCreationCallback: EvaluatorCallback = approveCallback();

    /**
     * Callback that indicates if the attribute should be shown on the update api.
     */
    public showOnUpdateCallback: ResourceEvaluatorCallback = approveCallback();

    /**
     * Callback that indicates if the attribute should be shown on the association api.
     */
    public showOnAssociationCallback: ResourceEvaluatorCallback =
      approveCallback();

    /**
     * Specify that the attribute should be hidden from the index api.
     */
    public hideFromIndex(
      callback: ResourceEvaluatorCallback | boolean = true,
    ): this {
      this.showOnIndexCallback = reverseEvaluatorCallback(callback);

      return this;
    }

    /**
     * Specify that the attribute should be hidden from the detail api.
     */
    public hideFromDetail(
      callback: ResourceEvaluatorCallback | boolean = true,
    ): this {
      this.showOnDetailCallback = reverseEvaluatorCallback(callback);

      return this;
    }

    /**
     * Specify that the attribute should be hidden from the review api.
     */
    public hideFromReview(
      callback: ResourceEvaluatorCallback | boolean = true,
    ): this {
      this.showOnReviewCallback = reverseEvaluatorCallback(callback);

      return this;
    }

    /**
     * Specify that the attribute should be hidden from the association api.
     */
    public hideFromAssociation(
      callback: ResourceEvaluatorCallback | boolean = true,
    ): this {
      this.showOnAssociationCallback = reverseEvaluatorCallback(callback);

      return this;
    }

    /**
     * Specify that the attribute should be hidden from the creation api.
     */
    public hideWhenCreating(
      callback: EvaluatorCallback | boolean = true,
    ): this {
      this.showOnCreationCallback = reverseEvaluatorCallback(callback);

      return this;
    }

    /**
     * Specify that the attribute should be hidden from the update api.
     */
    public hideWhenUpdating(
      callback: ResourceEvaluatorCallback | boolean = true,
    ): this {
      this.showOnUpdateCallback = reverseEvaluatorCallback(callback);

      return this;
    }

    /**
     * Specify that the attribute should be visible on the index api.
     */
    public showOnIndex(
      callback: ResourceEvaluatorCallback | boolean = true,
    ): this {
      this.showOnIndexCallback = makeEvaluatorCallback(callback);

      return this;
    }

    /**
     * Specify that the attribute should be hidden from the detail api.
     */
    public showOnDetail(
      callback: ResourceEvaluatorCallback | boolean = true,
    ): this {
      this.showOnDetailCallback = makeEvaluatorCallback(callback);

      return this;
    }

    /**
     * Specify that the attribute should be hidden from the review api.
     */
    public showOnReview(
      callback: ResourceEvaluatorCallback | boolean = true,
    ): this {
      this.showOnReviewCallback = makeEvaluatorCallback(callback);

      return this;
    }

    /**
     * Specify that the attribute should be hidden from the association api.
     */
    public showOnAssociation(
      callback: ResourceEvaluatorCallback | boolean = true,
    ): this {
      this.showOnAssociationCallback = makeEvaluatorCallback(callback);

      return this;
    }

    /**
     * Specify that the attribute should be hidden from the creation api.
     */
    public showOnCreating(callback: EvaluatorCallback | boolean = true): this {
      this.showOnCreationCallback = makeEvaluatorCallback(callback);

      return this;
    }

    /**
     * Specify that the attribute should be hidden from the update api.
     */
    public showOnUpdating(
      callback: ResourceEvaluatorCallback | boolean = true,
    ): this {
      this.showOnUpdateCallback = makeEvaluatorCallback(callback);

      return this;
    }

    /**
     * Check for showing when updating.
     */
    public isShownOnUpdate(request: AvonRequest, resource: Model): boolean {
      return this.showOnUpdateCallback(request, resource);
    }

    /**
     * Check showing on index.
     */
    public isShownOnIndex(request: AvonRequest, resource: Model): boolean {
      return this.showOnIndexCallback(request, resource);
    }

    /**
     * Determine if the field is to be shown on the detail api.
     */
    public isShownOnDetail(request: AvonRequest, resource: Model): boolean {
      return this.showOnDetailCallback(request, resource);
    }

    /**
     * Determine if the field is to be shown on the review api.
     */
    public isShownOnReview(request: AvonRequest, resource: Model): boolean {
      return this.showOnReviewCallback(request, resource);
    }

    /**
     * Determine if the field is to be shown on the review api.
     */
    public isShownOnAssociation(request: AvonRequest): boolean {
      return this.showOnAssociationCallback(request);
    }

    /**
     * Check for showing when creating.
     */
    public isShownOnCreation(request: AvonRequest): boolean {
      return this.showOnCreationCallback(request);
    }

    /**
     * Specify that the attribute should only be shown on the index api.
     */
    public onlyOnIndex(): this {
      this.showOnIndex(true);
      this.showOnDetail(false);
      this.showOnReview(false);
      this.showOnAssociation(false);
      this.showOnCreating(false);
      this.showOnUpdating(false);

      return this;
    }

    /**
     * Specify that the attribute should only be shown on the detail api.
     */
    public onlyOnDetail(): this {
      this.showOnIndex(false);
      this.showOnDetail(true);
      this.showOnReview(false);
      this.showOnAssociation(false);
      this.showOnCreating(false);
      this.showOnUpdating(false);

      return this;
    }

    /**
     * Specify that the attribute should only be shown on the review api.
     */
    public onlyOnReview(): this {
      this.showOnIndex(false);
      this.showOnDetail(false);
      this.showOnReview(true);
      this.showOnAssociation(false);
      this.showOnCreating(false);
      this.showOnUpdating(false);

      return this;
    }

    /**
     * Specify that the attribute should only be shown on the association api.
     */
    public onlyOnAssociation(): this {
      this.showOnIndex(false);
      this.showOnDetail(false);
      this.showOnReview(false);
      this.showOnAssociation(true);
      this.showOnCreating(false);
      this.showOnUpdating(false);

      return this;
    }

    /**
     * Specify that the attribute should only be shown on forms.
     */
    public onlyOnForms(): this {
      this.showOnIndex(false);
      this.showOnDetail(false);
      this.showOnReview(false);
      this.showOnAssociation(false);
      this.showOnCreating(true);
      this.showOnUpdating(true);

      return this;
    }

    /**
     * Specify that the attribute should be hidden from forms.
     */
    public exceptOnForms(): this {
      this.showOnIndex(true);
      this.showOnDetail(true);
      this.showOnReview(true);
      this.showOnAssociation(true);
      this.showOnCreating(false);
      this.showOnUpdating(false);

      return this;
    }
  }

  return Presentable;
};
