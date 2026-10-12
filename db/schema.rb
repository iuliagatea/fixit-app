# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 20180724095623112805) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  # Custom types defined in this database.
  # Note that some types may not work with other database engines. Be careful if changing database.
  create_enum "mpaa_rating", ["G", "PG", "PG-13", "R", "NC-17"]

  create_table "categories", force: :cascade do |t|
    t.string "entity"
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "estimates", force: :cascade do |t|
    t.string "name"
    t.float "quantity"
    t.float "price"
    t.float "value"
    t.bigint "tenant_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "product_id"
    t.index ["product_id"], name: "index_estimates_on_product_id"
    t.index ["tenant_id"], name: "index_estimates_on_tenant_id"
  end

  create_table "members", force: :cascade do |t|
    t.bigint "tenant_id"
    t.bigint "user_id"
    t.string "first_name"
    t.string "last_name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tenant_id"], name: "index_members_on_tenant_id"
    t.index ["user_id"], name: "index_members_on_user_id"
  end

  create_table "payments", force: :cascade do |t|
    t.string "email"
    t.string "token"
    t.bigint "tenant_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tenant_id"], name: "index_payments_on_tenant_id"
  end

  create_table "pg_search_documents", force: :cascade do |t|
    t.text "content"
    t.string "searchable_type"
    t.bigint "searchable_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["searchable_type", "searchable_id"], name: "index_pg_search_documents_on_searchable"
  end

  create_table "product_statuses", force: :cascade do |t|
    t.bigint "product_id"
    t.bigint "status_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_product_statuses_on_product_id"
    t.index ["status_id"], name: "index_product_statuses_on_status_id"
  end

  create_table "products", force: :cascade do |t|
    t.string "code"
    t.string "name"
    t.date "expected_completion_date"
    t.bigint "tenant_id"
    t.bigint "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "comments"
    t.bigint "current_status_id"
    t.index ["current_status_id"], name: "index_products_on_current_status_id"
    t.index ["tenant_id", "user_id"], name: "index_products_on_tenant_id_and_user_id"
    t.index ["tenant_id"], name: "index_products_on_tenant_id"
    t.index ["user_id"], name: "index_products_on_user_id"
  end

  create_table "reviews", force: :cascade do |t|
    t.bigint "tenant_id"
    t.bigint "user_id"
    t.string "title"
    t.text "review"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "rating"
    t.index ["tenant_id"], name: "index_reviews_on_tenant_id"
    t.index ["user_id"], name: "index_reviews_on_user_id"
  end

  create_table "seems_rateable_rates", force: :cascade do |t|
    t.bigint "rater_id"
    t.string "rateable_type"
    t.bigint "rateable_id"
    t.float "stars", null: false
    t.text "comment"
    t.string "dimension"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["rateable_type", "rateable_id"], name: "index_seems_rateable_rates_on_rateable"
    t.index ["rater_id"], name: "index_seems_rateable_rates_on_rater_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.string "session_id", null: false
    t.text "data"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["session_id"], name: "index_sessions_on_session_id", unique: true
    t.index ["updated_at"], name: "index_sessions_on_updated_at"
  end

  create_table "statuses", force: :cascade do |t|
    t.string "name"
    t.string "color"
    t.bigint "tenant_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_active", default: true
    t.boolean "can_be_deleted", default: true
    t.boolean "send_email", default: true
    t.index ["tenant_id"], name: "index_statuses_on_tenant_id"
  end

  create_table "tenant_categories", force: :cascade do |t|
    t.bigint "tenant_id"
    t.bigint "category_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_tenant_categories_on_category_id"
    t.index ["tenant_id"], name: "index_tenant_categories_on_tenant_id"
  end

  create_table "tenants", force: :cascade do |t|
    t.bigint "tenant_id"
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "plan"
    t.string "description"
    t.string "keywords"
    t.index ["name"], name: "index_tenants_on_name"
    t.index ["tenant_id"], name: "index_tenants_on_tenant_id"
    t.check_constraint "plan::text = ANY (ARRAY['free'::character varying, 'premium'::character varying]::text[])", name: "valid_plan"
  end

  create_table "tenants_users", id: false, force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.bigint "user_id", null: false
    t.index ["tenant_id", "user_id"], name: "index_tenants_users_on_tenant_id_and_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.inet "current_sign_in_ip"
    t.inet "last_sign_in_ip"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.boolean "skip_confirm_change_password", default: false
    t.bigint "tenant_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_admin", default: false
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["tenant_id"], name: "index_users_on_tenant_id"
  end

  add_foreign_key "estimates", "products"
  add_foreign_key "estimates", "tenants"
  add_foreign_key "members", "tenants"
  add_foreign_key "members", "users"
  add_foreign_key "payments", "tenants"
  add_foreign_key "product_statuses", "products"
  add_foreign_key "product_statuses", "statuses"
  add_foreign_key "products", "statuses", column: "current_status_id"
  add_foreign_key "products", "tenants"
  add_foreign_key "products", "users"
  add_foreign_key "reviews", "tenants"
  add_foreign_key "reviews", "users"
  add_foreign_key "statuses", "tenants"
  add_foreign_key "tenant_categories", "categories"
  add_foreign_key "tenant_categories", "tenants"
  add_foreign_key "tenants", "tenants"
end
