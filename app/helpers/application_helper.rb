# frozen_string_literal: true

module ApplicationHelper
  ALERT_TYPES = %i[success info warning danger].freeze unless const_defined?(:ALERT_TYPES)

  def bootstrap_flash(options = {})
    flash_messages = []
    flash.each do |type, message|
      # Skip empty messages, e.g. for devise messages set to nothing in a locale file.
      next if message.blank?

      type = type.to_sym
      type = :success if type == :notice
      type = :danger  if type == :alert
      type = :danger  if type == :error
      next unless ALERT_TYPES.include?(type)

      tag_class = options.extract!(:class)[:class]
      tag_options = {
        class: "alert alert-#{type} alert-dismissible fade show #{tag_class}"
      }.merge(options)

      close_button = content_tag(:button, raw(''), type: 'button', class: 'btn-close', 'data-bs-dismiss' => 'alert')

      Array(message).each do |msg|
        text = content_tag(:div, close_button + msg, tag_options)
        flash_messages << text if msg
      end
    end
    flash_messages.join("\n").html_safe
  end

  def tenant_name(tenant_id)
    Tenant.find(tenant_id).name
  end

  def class_name_for_tenant_form(tenant)
    return 'cc_form' if tenant.payment.blank?

    ''
  end

  def user_full_name(user = nil)
    user ||= current_user
    user.is_admin ? user.tenants.first.name : "#{user.member.first_name} #{user.member.last_name}"
  end

  def format_date(date)
    date.strftime('%d.%m.%Y')
  end

  def format_date_time(date)
    date.strftime('%d.%m.%Y %I:%M:%S')
  end

  def tenants_categories(tenants)
    tenants.map(&:categories).map(&:to_a).uniq.flatten
  end
end
