# frozen_string_literal: true

class CreateEstimates < ActiveRecord::Migration[7.2]
  def change
    create_table :estimates do |t|
      t.string :name
      t.float :quantity
      t.float :price
      t.float :value
      t.belongs_to :tenant, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
