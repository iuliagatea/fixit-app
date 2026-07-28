class AddCurrentStatusIdToProducts < ActiveRecord::Migration[7.2]
  def change
    add_reference :products, :current_status, foreign_key: { to_table: :statuses }
  end
end
