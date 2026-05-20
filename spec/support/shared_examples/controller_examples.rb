# frozen_string_literal: true

# here assigned_resource and resource class are parameters passed to index block
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
  xit 'redirects to sign in path' do
    logout(admin_user)
    expect(subject).to redirect_to(root_path)
  end
end
