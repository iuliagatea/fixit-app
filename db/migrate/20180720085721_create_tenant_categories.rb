# frozen_string_literal: true

class CreateTenantCategories < ActiveRecord::Migration[7.2]
  def change
    create_table :tenant_categories do |t|
      t.references :tenant, index: true, foreign_key: true
      t.references :category, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
