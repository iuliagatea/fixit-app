# frozen_string_literal: true

class ActsAsReviewableMigration < ActiveRecord::Migration[7.2]
  def self.up
    create_table :reviews do |t|
      t.references  :reviewable,    polymorphic: true

      t.references  :reviewer,      polymorphic: true

      t.float       :rating
      t.text        :comment

      #
      # Custom fields go here...
      #
      # t.string      :title
      # t.string      :intention
      # ...
      #

      t.timestamps
    end

    add_index :reviews, :reviewer_id
    add_index :reviews, :reviewer_type
    add_index :reviews, %i[reviewer_id reviewer_type]
    add_index :reviews, %i[reviewable_id reviewable_type]
  end

  def self.down
    drop_table :reviews
  end
end
