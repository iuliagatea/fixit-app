# frozen_string_literal: true

class AddProductToEstimate < ActiveRecord::Migration[7.2]
  def change
    add_reference :estimates, :product, index: true, foreign_key: true
  end
end
