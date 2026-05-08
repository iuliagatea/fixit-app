# frozen_string_literal: true

class AddColumnToProducts < ActiveRecord::Migration[7.2]
  def change
    add_column :products, :comments, :text
  end
end
