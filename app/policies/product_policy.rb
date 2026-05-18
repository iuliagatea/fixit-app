# frozen_string_literal: true

class ProductPolicy < ApplicationPolicy
  def index?
    user.is_admin || user.tenants.include?(record.tenant)
  end

  def show?
    user.is_admin || record.user == user || user.tenants.include?(record.tenant)
  end

  def create?
    user.is_admin || user.tenants.include?(record.tenant)
  end

  def update?
    user.is_admin || record.user == user
  end

  def destroy?
    user.is_admin || record.user == user
  end
end
