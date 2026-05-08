# frozen_string_literal: true

class AddColumnToStatuses < ActiveRecord::Migration[7.2]
  def change
    add_column :statuses, :send_email, :boolean, default: true
  end
end
