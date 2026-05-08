# frozen_string_literal: true

class AddRowsToCategory < ActiveRecord::Migration[7.2]
  def self.up
    Category.create(entity: 'tenant', name: 'Arhitectura / Design interior')
    Category.create(entity: 'tenant', name: 'Auto / Moto / Biciclete')
    Category.create(entity: 'tenant', name: 'Confectii / Design vestimentar')
    Category.create(entity: 'tenant', name: 'Constructii / Instalatiir')
    Category.create(entity: 'tenant', name: 'Electrocasnice')
    Category.create(entity: 'tenant', name: 'IT Hardware')
    Category.create(entity: 'tenant', name: 'IT Software')
    Category.create(entity: 'tenant', name: 'Prelucrarea lemnului / PVC')
    Category.create(entity: 'tenant', name: 'Service / Reparatii')
    Category.create(entity: 'tenant', name: 'Tamplarie')
    Category.create(entity: 'tenant', name: 'Transport / Distributie')
  end

  def self.down
    Category.delete_all
  end
end
