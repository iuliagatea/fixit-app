# frozen_string_literal: true

class AddConstraints < ActiveRecord::Migration[7.2]
  def change
    add_index :products, %i[tenant_id user_id]
    add_check_constraint :tenants, "plan IN ('free', 'premium')", name: 'valid_plan'
  end
end
