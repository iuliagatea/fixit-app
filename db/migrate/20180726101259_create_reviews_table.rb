# frozen_string_literal: true

class CreateReviewsTable < ActiveRecord::Migration[7.2]
  def change
    create_table :reviews do |t|
      t.references :tenant, index: true, foreign_key: true
      t.references :user, index: true, foreign_key: true
      t.string :title
      t.text :review

      t.timestamps null: false
    end
  end
end
