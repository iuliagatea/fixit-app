# frozen_string_literal: true

require 'sidekiq/web'

Rails.application.routes.draw do
  mount Sidekiq::Web => '/sidekiq' # access it at http://localhost:3000/sidekiq

  namespace :api do
    namespace :v1 do
      get 'ping', to: 'health#ping'
      post 'sign_in', to: 'sessions#create'
      delete 'sign_out', to: 'sessions#destroy'
      get 'me', to: 'sessions#show'
    end
  end

  # React SPA shell (Phase 1+ of the migration, see plan/migration_to_react.md).
  # React Router owns everything under /app client-side.
  get 'app', to: 'spa#show'
  get 'app/*path', to: 'spa#show'

  root to: 'home#index'
  resources :categories
  resources :reviews, param: :review_id
  resources :tenants, param: :tenant_id
  resources :tenants, only: [] do
    resources :statuses do
      get 'products'
    end
    resources :products do
      get 'send_product_card', to: 'products#send_product_card'
      resources :estimates
    end
    resources :product_statuses
    resources :user do
      get 'products', to: 'tenant_member_products#index'
    end
    get 'contact'
    post 'send_email'
    match '/plan/edit' => 'tenants#edit', via: :get, as: :edit_plan
    match '/plan/update' => 'tenants#update', via: %i[put patch], as: :update_plan
  end

  get 'about', to: 'pages#about'
  get 'get_name', to: 'members#get_name'
  get 'demand_offer', to: 'home#contact'
  post 'search', to: 'tenants#search'
  resources :tenants, member: { rate: :put }
  # *MUST* come *BEFORE* devise's definitions (below)
  as :user do
    match '/user/confirmation' => 'confirmations#update', :via => :put, :as => :update_user_confirmation
  end

  devise_for :users, controllers: {
    registrations: 'registrations',
    confirmations: 'confirmations',
    sessions: 'sessions'
  }
end
