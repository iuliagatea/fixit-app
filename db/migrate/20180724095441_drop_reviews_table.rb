# frozen_string_literal: true

class DropReviewsTable < ActiveRecord::Migration[7.2]
  def change
    drop_table :reviews
  end
end
