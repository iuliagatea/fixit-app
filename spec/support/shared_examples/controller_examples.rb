# frozen_string_literal: true

# here assigned_resource and resource class are parameters passed to index block
RSpec.shared_examples 'index' do |resource|
  let(:assigned_resource) { resource.pluralize.to_sym }
  let(:resource_class) { resource.capitalize.constantize }
  it { expect(subject).to have_http_status(200) }
  it { expect(subject).to render_template(:index) }
  it {
    subject

    expect(assigns(assigned_resource)).to match(resource_class.all)
  }
end

RSpec.shared_examples 'new' do |resource|
  it 'assigns values to variables' do
    subject
    expect(assigns(resource).id).to be_nil
  end
  it { expect(subject).to render_template(:new) }
end

RSpec.shared_examples 'create' do |resource_class|
  it 'saves a new record' do
    expect { subject }.to change(resource_class, :count).by(1)
  end
end

RSpec.shared_examples 'destroy' do |resource_class|
  it 'deletes the record' do
    expect { subject }.to change(resource_class, :count).by(-1)
  end
end

RSpec.shared_examples_for 'redirect if not logged in' do
  it 'redirects to sign in path' do
    logout(admin_user)
    expect(subject).to redirect_to(root_path)
  end
end
