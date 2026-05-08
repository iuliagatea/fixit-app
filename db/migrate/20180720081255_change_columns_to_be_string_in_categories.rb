# frozen_string_literal: true

class ChangeColumnsToBeStringInCategories < ActiveRecord::Migration[7.2]
  def change
    change_column :categories, :entity, :string
    change_column :categories, :name, :string
  end
end
