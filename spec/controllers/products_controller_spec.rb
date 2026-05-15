# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ProductsController do
  include_context 'initialize'

  describe 'GET #index' do
    subject { get :index, params: { tenant_id: tenant.id } }
#     it_should_behave_like 'redirect if not logged in'
    context 'logged in' do
      before { products }
      it 'renders a list of categories' do
        subject
        expect(assigns(:products)).to match(tenant.products)
      end
      it { expect(subject).to render_template(:index) }
    end
  end

  describe 'GET #show' do
    subject { get :show, params: { tenant_id: tenant.id, id: product.id } }
    it_should_behave_like 'redirect if not logged in'
    context 'logged in' do
      it 'assigns values to variables' do
        subject
        expect(assigns(:product)).to eq(product)
      end
      it { expect(subject).to render_template(:show) }
    end
  end

  describe 'GET #new' do
    subject { get :new, params: { tenant_id: tenant.id } }
    it_should_behave_like 'redirect if not logged in'
    context 'logged in' do
      include_examples "new", 'product'
    end
  end

  describe 'POST #create' do
    let(:create_attributes) { attributes_for(:product, tenant_id: tenant.id) }
    subject do
      post :create, params: { tenant_id: tenant.id, product: create_attributes, user: { email: customer.email },
                    status: { id: tenant.statuses.first } }
    end
    it_should_behave_like 'redirect if not logged in'
    context 'logged in' do
      context 'with customer not in db' do
        let(:customer_attributes) { attributes_for(:user, :regular) }
        let(:member_attributes) { attributes_for(:member) }
        subject do
          post :create, params: { tenant_id: tenant.id, product: create_attributes, user: customer_attributes, member: member_attributes,
                        status: { id: tenant.statuses.first } }
        end
        it 'creates a new customer' do
          expect { subject }.to change(User, :count).by(1)
        end
        it 'creates a new member' do
          expect { subject }.to change(Member, :count).by(1)
        end
        it 'saves a new product' do
          expect { subject }.to change(Product, :count).by(1)
        end
        it 'redirects to product show' do
          expect(subject).to redirect_to(tenant_products_path(tenant_id: tenant.id))
        end
        it 'sends product status change email' do
          expect { subject }.to change { ActionMailer::Base.deliveries.count }.by(2) # including customer confirmation
        end
      end
      context 'with existing customer' do
        before { customer }
        it 'does not create a new customer' do
          expect { subject }.to change(User, :count).by(0)
        end
        it 'assigns tenant for customer' do
          subject
          expect(assigns[:product].tenant).to eq(tenant)
        end
        it 'assigns a new status for product' do
          subject
          expect(assigns(:product).current_status).to eq(tenant.statuses.first)
        end
        it 'saves a new product' do
          expect { subject }.to change(Product, :count).by(1)
        end
        it 'redirects to product show' do
          expect(subject).to redirect_to(tenant_products_path(tenant_id: tenant.id))
        end
        it 'sends product status change email' do
          expect { subject }.to change { ActionMailer::Base.deliveries.count }.by(1)
        end
      end
    end
  end

  describe 'GET #edit' do
    subject { get :edit, params: { tenant_id: tenant.id, id: product.id } }
    it_should_behave_like 'redirect if not logged in'
    context 'logged in' do
      it 'assigns values to variables' do
        subject
        expect(assigns(:product)).to eq(product)
        expect(assigns(:user)).to eq(product.user)
        expect(assigns(:statuses)).to eq(tenant.statuses)
      end
      it { expect(subject).to render_template(:edit) }
    end
  end

  describe 'PUT #update' do
    let(:new_completion_date) { 10.days.from_now.to_date }
    let(:new_status) { tenant.statuses.last }
    let(:estimate_attributes) { attributes_for(:estimate) }
    let(:update_attributes) do
      { expected_completion_date: new_completion_date, estimates_attributes: [estimate_attributes] }
    end
    subject do
      patch :update, params: { tenant_id: tenant.id, id: product.id, product: update_attributes,
                     user: { email: customer.email }, status: { id: new_status } }
    end
    it_should_behave_like 'redirect if not logged in'
    context 'logged in' do
      before { product }
      it 'does not create a new product' do
        expect { subject }.to change(Product, :count).by(0)
      end
      it 'does not create a new user' do
        expect { subject }.to change(User, :count).by(0)
      end
      it 'updates product with new params' do
        subject
        expect(assigns(:product).expected_completion_date).to eq(new_completion_date)
      end
      it 'updates product current status' do
        subject
        expect(assigns(:product).current_status).to eq(new_status)
      end
      it 'updates estimates' do
        expect { subject }.to change(Estimate, :count).by(1)
        expect(assigns(:product).estimates.last.name).to eq(estimate_attributes[:name])
      end
      it 'redirects to tenant products' do
        subject
        expect(subject).to redirect_to(tenant_products_path(tenant_id: tenant.id))
      end
      it 'sends product status change email' do
        expect { subject }.to change { ActionMailer::Base.deliveries.count }.by(1)
      end
    end
  end

  describe 'DELETE #destroy' do
    let(:estimates_count) { product.estimates.count }
    subject { delete :destroy, params: { tenant_id: tenant.id, id: product.id } }
    it_should_behave_like 'redirect if not logged in'
    context 'logged in' do
      before { product }
      it 'does not delete the tenant' do
        expect { subject }.to change(Tenant, :count).by(0)
      end
      it 'does not delete the user' do
        expect { subject }.to change(User, :count).by(0)
      end
      it 'deletes the product' do
        expect { subject }.to change(Product, :count).by(-1)
      end
      it 'deletes the estimates' do
        expect { subject }.to change(Estimate, :count).by(-1 * estimates_count)
      end
    end
  end
end
