# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CategoriesController do
  include_context 'initialize'

  before do
    admin_user.email = 'fixit.app2@gmail.com'
    admin_user.save!
  end

  let!(:categories) { create_list(:category, 10) }
  let(:category) { categories.first }

  describe 'GET #index' do
    subject { get :index }
    include_examples "index", 'category'
  end

  describe 'GET #new' do
    subject { get :new }
    include_examples "new", :category
  end

  describe 'POST #create' do
    let(:create_attributes) { attributes_for(:category) }
    subject { post :create, params: { category: create_attributes } }
    include_examples "create", Category
  end

  describe 'GET #show' do
    subject { get :show, params: { id: category.id } }
    before { category }
    it 'assigns values to variables' do
      subject
      expect(assigns(:category)).to eq(category)
    end
    it { expect(subject).to render_template(:show) }
  end

  describe 'GET #edit' do
    subject { get :edit, params: { id: category.id } }
    before { category }
    it 'assigns values to variables' do
      subject
      expect(assigns(:category)).to eq(category)
    end
    it { expect(subject).to render_template(:edit) }
  end

  describe 'PATCH #update' do
    let(:new_name) { 'New name' }
    let(:update_attributes) do
      { name: new_name }
    end
    subject { patch :update, params: { id: category.id, category: update_attributes } }
    before { category }
    it 'does not save a new category' do
      expect { subject }.to change(Category, :count).by(0)
    end
    it 'updates category with new params' do
      subject
      expect(assigns(:category).name).to eq(new_name)
    end
  end

  describe 'Delete #destroy' do
    subject { delete :destroy, params: { id: category.id } }
    before { category }
    include_examples "destroy", Category
  end
end
