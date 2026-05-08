# frozen_string_literal: true

class AddColumnsToStatuses < ActiveRecord::Migration[7.2]
  def change
    add_column :statuses, :is_active, :boolean, default: true
    add_column :statuses, :can_be_deleted, :boolean, default: true
  end
end
