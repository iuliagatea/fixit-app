# frozen_string_literal: true

class CreateProductStatuses < ActiveRecord::Migration[7.2]
  def change
    create_table :product_statuses do |t|
      t.belongs_to :product, index: true, foreign_key: true
      t.belongs_to :status, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
